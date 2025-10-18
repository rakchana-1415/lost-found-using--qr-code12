import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";

const CreateQR = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [uniqueCode, setUniqueCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-qr-user', {
        body: { name: name.trim(), phone: phone.trim() }
      });

      if (error) throw error;

      const scanUrl = `${window.location.origin}/scan?code=${data.uniqueCode}`;
      const qrDataUrl = await QRCode.toDataURL(scanUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCode(qrDataUrl);
      setUniqueCode(data.uniqueCode);
      toast.success("QR Code generated successfully!");
    } catch (error: any) {
      console.error('Error creating QR:', error);
      toast.error(error.message || "Failed to create QR code");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${uniqueCode}.png`;
    link.href = qrCode;
    link.click();
  };

  const reset = () => {
    setName("");
    setPhone("");
    setQrCode(null);
    setUniqueCode(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/my-qr')}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          Check Notifications
        </Button>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lost & Found QR Generator</CardTitle>
          <CardDescription>
            Create a QR code for your valuable items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!qrCode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Generating..." : "Generate QR Code"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCode} alt="QR Code" className="w-full max-w-xs mx-auto" />
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Your unique code</p>
                <p className="text-lg font-bold font-mono">{uniqueCode}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save this code to check scan notifications
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Print this QR code and attach it to your valuable items
              </p>

              <div className="flex gap-2">
                <Button onClick={downloadQR} className="flex-1">
                  Download QR
                </Button>
                <Button onClick={reset} variant="outline" className="flex-1">
                  Create Another
                </Button>
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/my-qr`)}
                className="w-full gap-2"
              >
                <Bell className="h-4 w-4" />
                View Scan Notifications
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateQR;
