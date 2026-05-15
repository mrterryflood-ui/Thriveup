import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Printer, RotateCcw, Eye } from "lucide-react";

interface CardData {
  name: string;
  credentials: string;
  title: string;
  organization: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address1: string;
  address2: string;
}

function BusinessCardFront({ data, theme }: { data: CardData; theme: string }) {
  const themes: Record<string, { bg: string; accent: string; text: string; subtext: string; accentText: string; border: string }> = {
    executive: {
      bg: "bg-gradient-to-br from-[#1a1a2e] to-[#16213e]",
      accent: "bg-gradient-to-r from-[#c4a35a] to-[#d4b96a]",
      text: "text-white",
      subtext: "text-gray-300",
      accentText: "text-[#c4a35a]",
      border: "border-[#c4a35a]/30",
    },
    modern: {
      bg: "bg-gradient-to-br from-[#7b1e3a] to-[#4a0e22]",
      accent: "bg-white",
      text: "text-white",
      subtext: "text-rose-200",
      accentText: "text-white",
      border: "border-white/20",
    },
    clean: {
      bg: "bg-white",
      accent: "bg-gradient-to-r from-[#7b1e3a] to-[#a02050]",
      text: "text-gray-900",
      subtext: "text-gray-500",
      accentText: "text-[#7b1e3a]",
      border: "border-gray-200",
    },
    bold: {
      bg: "bg-gradient-to-br from-[#0f4c75] to-[#1b262c]",
      accent: "bg-gradient-to-r from-[#bbe1fa] to-[#3282b8]",
      text: "text-white",
      subtext: "text-blue-200",
      accentText: "text-[#bbe1fa]",
      border: "border-[#3282b8]/30",
    },
  };

  const t = themes[theme] || themes.executive;

  return (
    <div
      className={`relative w-[350px] h-[200px] rounded-lg overflow-hidden shadow-2xl ${t.bg} ${t.border} border`}
      data-testid="card-front"
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${t.accent}`} />

      <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="80" cy="20" r="60" fill="currentColor" className={t.text} />
        </svg>
      </div>

      <div className="p-5 h-full flex flex-col justify-between relative z-10">
        <div>
          <h2 className={`text-lg font-bold tracking-wide ${t.text}`}>
            {data.name}
            {data.credentials && (
              <span className={`text-xs font-normal ml-1 ${t.subtext}`}>{data.credentials}</span>
            )}
          </h2>
          <p className={`text-xs font-semibold uppercase tracking-widest mt-0.5 ${t.accentText}`}>
            {data.title}
          </p>
        </div>

        <div>
          <p className={`text-sm font-bold ${t.text}`}>{data.organization}</p>
          <p className={`text-[9px] italic mt-0.5 ${t.subtext}`}>{data.tagline}</p>
        </div>

        <div className={`flex gap-6 text-[9px] ${t.subtext}`}>
          <div className="space-y-0.5">
            <p>{data.phone}</p>
            <p>{data.email}</p>
          </div>
          <div className="space-y-0.5">
            <p>{data.website}</p>
            <p>{data.address1}</p>
            {data.address2 && <p>{data.address2}</p>}
          </div>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 w-full h-0.5 ${t.accent}`} />
    </div>
  );
}

function BusinessCardBack({ data, theme }: { data: CardData; theme: string }) {
  const themes: Record<string, { bg: string; accent: string; text: string; subtext: string }> = {
    executive: {
      bg: "bg-gradient-to-br from-[#1a1a2e] to-[#16213e]",
      accent: "from-[#c4a35a] to-[#d4b96a]",
      text: "text-white",
      subtext: "text-gray-400",
    },
    modern: {
      bg: "bg-gradient-to-br from-[#7b1e3a] to-[#4a0e22]",
      accent: "from-white to-rose-100",
      text: "text-white",
      subtext: "text-rose-200",
    },
    clean: {
      bg: "bg-white",
      accent: "from-[#7b1e3a] to-[#a02050]",
      text: "text-gray-900",
      subtext: "text-gray-500",
    },
    bold: {
      bg: "bg-gradient-to-br from-[#0f4c75] to-[#1b262c]",
      accent: "from-[#bbe1fa] to-[#3282b8]",
      text: "text-white",
      subtext: "text-blue-200",
    },
  };

  const t = themes[theme] || themes.executive;

  const platforms = [
    "ThriveUp Academy", "Sankofa Health", "LifeBridge",
    "WholeMind Learning", "SafeCogniCare", "Mission Transition"
  ];

  return (
    <div
      className={`relative w-[350px] h-[200px] rounded-lg overflow-hidden shadow-2xl ${t.bg} border border-white/10`}
      data-testid="card-back"
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${t.accent}`} />

      <div className="p-5 h-full flex flex-col items-center justify-center text-center relative z-10">
        <div className="mb-3">
          <h3 className={`text-base font-bold ${t.text}`}>The Collaborative Advocate Foundation</h3>
          <p className={`text-[9px] uppercase tracking-[0.2em] mt-1 ${t.subtext}`}>
            24-Platform Community Ecosystem
          </p>
        </div>

        <div className={`w-16 h-px bg-gradient-to-r ${t.accent} my-2`} />

        <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2">
          {platforms.map((p) => (
            <p key={p} className={`text-[7px] ${t.subtext}`}>{p}</p>
          ))}
        </div>

        <p className={`text-[8px] mt-3 font-medium ${t.subtext}`}>
          501(c)(3) Nonprofit | EIN: 41-3618003
        </p>
        <p className={`text-[8px] ${t.subtext}`}>{data.website}</p>
      </div>

      <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r ${t.accent}`} />
    </div>
  );
}

export default function BusinessCardPage() {
  const [theme, setTheme] = useState("executive");
  const [showBack, setShowBack] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [cardData, setCardData] = useState<CardData>({
    name: "Dr. Terry Flood",
    credentials: "DHA, DBA, MS",
    title: "Founder & Chief Executive Officer",
    organization: "The Collaborative Advocate Foundation",
    tagline: "Building workforce and health infrastructure for underserved communities",
    phone: "254-319-8460",
    email: "president@thecollaborativeadvocate.org",
    website: "thrivingcommunitiesforall.com",
    address1: "17912 Stefano Drive",
    address2: "Pflugerville, TX 78660",
  });

  const updateField = (field: keyof CardData, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>TCAF Business Card</title>
          <style>
            @page { size: 3.5in 2in; margin: 0; }
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
            .card-container { width: 3.5in; height: 2in; }
          </style>
        </head>
        <body>
          <div class="card-container">
            ${printRef.current?.innerHTML || ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const themeOptions = [
    { id: "executive", label: "Executive", desc: "Navy & Gold" },
    { id: "modern", label: "Modern", desc: "Crimson & White" },
    { id: "clean", label: "Clean", desc: "White & Crimson" },
    { id: "bold", label: "Bold", desc: "Navy & Blue" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Business Card Designer</h1>
        <p className="text-muted-foreground text-sm mt-1">Design and preview your TCAF business card</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-5">
          <h2 className="font-semibold text-lg">Card Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Full Name</Label>
              <Input
                id="name"
                value={cardData.name}
                onChange={(e) => updateField("name", e.target.value)}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="credentials" className="text-xs">Credentials</Label>
              <Input
                id="credentials"
                value={cardData.credentials}
                onChange={(e) => updateField("credentials", e.target.value)}
                data-testid="input-credentials"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input
              id="title"
              value={cardData.title}
              onChange={(e) => updateField("title", e.target.value)}
              data-testid="input-title"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="organization" className="text-xs">Organization</Label>
            <Input
              id="organization"
              value={cardData.organization}
              onChange={(e) => updateField("organization", e.target.value)}
              data-testid="input-organization"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tagline" className="text-xs">Tagline</Label>
            <Input
              id="tagline"
              value={cardData.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              data-testid="input-tagline"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input
                id="phone"
                value={cardData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                value={cardData.email}
                onChange={(e) => updateField("email", e.target.value)}
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="website" className="text-xs">Website</Label>
            <Input
              id="website"
              value={cardData.website}
              onChange={(e) => updateField("website", e.target.value)}
              data-testid="input-website"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="address1" className="text-xs">Address Line 1</Label>
              <Input
                id="address1"
                value={cardData.address1}
                onChange={(e) => updateField("address1", e.target.value)}
                data-testid="input-address1"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address2" className="text-xs">Address Line 2</Label>
              <Input
                id="address2"
                value={cardData.address2}
                onChange={(e) => updateField("address2", e.target.value)}
                data-testid="input-address2"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Preview</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBack(!showBack)}
                  data-testid="button-flip"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  {showBack ? "Front" : "Back"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  data-testid="button-print"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center py-6 bg-muted/30 rounded-lg" ref={printRef}>
              {showBack ? (
                <BusinessCardBack data={cardData} theme={theme} />
              ) : (
                <BusinessCardFront data={cardData} theme={theme} />
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-lg mb-3">Theme</h2>
            <div className="grid grid-cols-2 gap-2">
              {themeOptions.map((opt) => (
                <Button
                  key={opt.id}
                  variant={theme === opt.id ? "default" : "outline"}
                  size="sm"
                  className="justify-start h-auto py-2 px-3"
                  onClick={() => setTheme(opt.id)}
                  data-testid={`button-theme-${opt.id}`}
                >
                  <div className="text-left">
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[10px] opacity-70">{opt.desc}</p>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-4">All Themes — Front & Back</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {themeOptions.map((opt) => (
            <div key={opt.id} className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{opt.label} — {opt.desc}</p>
              <div className="flex flex-col items-center gap-3">
                <BusinessCardFront data={cardData} theme={opt.id} />
                <BusinessCardBack data={cardData} theme={opt.id} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
