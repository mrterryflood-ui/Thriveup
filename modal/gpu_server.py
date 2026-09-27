"""Modal GPU server — inference backend ThriveUp can call for model-bound work
(narrative drafting, embedding, reranking) when an external vendor quota or
privacy posture says "run it ourselves".

Deploy locally (tokens live in ~/.modal.toml after `modal token new`):
    pip install modal
    modal deploy modal/gpu_server.py

Choose a different GPU tier at deploy time (no code edit):
    GPU_CLASS=A10G modal deploy modal/gpu_server.py
Valid tiers: T4 | L4 | A10G | A100 | H100   (default: L4)

Swap the served model without a code change:
    MODEL_ID=Qwen/Qwen2.5-14B-Instruct modal deploy modal/gpu_server.py

Contract: POST { endpoint_url } with JSON body {"prompt", "max_tokens?"}
and header  x-modal-key: <shared secret>.  Wrong or missing key -> 401.
The shared secret lives in the Modal secret `thriveup-modal-key` and in the
Vercel env var THRIVEUP_MODAL_KEY.  Values are never logged.

Honesty contract (doctrine): every response carries model_generated=true so
inference output is never confused with observed data. This service does not
know facts; it produces text. Callers must keep inference out of the measurement
pipeline.
"""

import os

import modal

GPU_TIERS = {"T4", "L4", "A10G", "A100", "H100"}
GPU_CLASS = os.environ.get("GPU_CLASS", "L4").upper()
if GPU_CLASS not in GPU_TIERS:
    raise ValueError(f"GPU_CLASS must be one of {sorted(GPU_TIERS)}, got {GPU_CLASS!r}")

MODEL_ID = os.environ.get("MODEL_ID", "meta-llama/Meta-Llama-3.1-8B-Instruct")

app = modal.App("thriveup-gpu")

server_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("vllm>=0.6.3,<0.7", "fastapi>=0.110,<1.0", "numpy<2")
)

model_cache = modal.Volume.from_name("thriveup-model-cache", create_if_missing=True)


@app.cls(
    image=server_image,
    gpu=GPU_CLASS,
    volumes={"/model-cache": model_cache},
    scaledown_window=900,
)
class Model:
    @modal.enter()
    def load(self) -> None:
        from vllm import LLM, SamplingParams

        self._sampling_default = SamplingParams
        self.llm = LLM(
            model=MODEL_ID,
            download_dir="/model-cache",
            max_model_len=8192,
        )

    @modal.method()
    def produce(self, prompt: str, max_tokens: int = 512) -> dict:
        params = self._sampling_default(max_tokens=max_tokens, temperature=0.2)
        output = self.llm.generate([prompt], params)
        return {
            "completion": output[0].outputs[0].text,
            "model": MODEL_ID,
            "gpu_class": GPU_CLASS,
        }


@app.function(
    image=server_image,
    secrets=[modal.Secret.from_name("thriveup-modal-key")],
)
@modal.web_endpoint(method="POST")
def generate(item: dict):
    from fastapi import HTTPException

    expected = os.environ.get("THRIVEUP_MODAL_KEY", "")
    provided = item.pop("x_modal_key", None)
    if not expected or not provided or provided != expected:
        raise HTTPException(status_code=401, detail="unauthorized")
    prompt = (item.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt required")
    max_tokens = min(int(item.get("max_tokens") or 512), 2048)
    result = Model().produce.remote(prompt, max_tokens)
    result["model_generated"] = True
    return result
