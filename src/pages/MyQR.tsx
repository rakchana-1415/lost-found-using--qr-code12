import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Smartphone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScanEvent {
  id: string;
  scanned_at: string;
  ip_address: string;
  user_agent: string;
}

interface QRUser {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

const MyQR = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrUser, setQrUser] = useState<QRUser | null>(null);
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [isListening, setIsListening] = useState(false);

  const checkQR = async () => {
    if (!code.trim()) {
      toast.error("Please enter your unique code");
      return;
    }

    setLoading(true);

    try {
      // Fetch QR user info
      const { data: userData, error: userError } = await supabase
        .from('qr_users')
        .select('*')
        .eq('unique_code', code.trim())
        .single();

      if (userError || !userData) {
        toast.error("QR code not found");
        setLoading(false);
        return;
      }

      setQrUser(userData);

      // Fetch scan history
      const { data: scansData, error: scansError } = await supabase
        .from('qr_scans')
        .select('*')
        .eq('qr_user_id', userData.id)
        .order('scanned_at', { ascending: false });

      if (!scansError && scansData) {
        setScans(scansData);
      }

      toast.success("QR code found!");
      setupRealtimeListener(userData.id);
    } catch (error) {
      console.error('Error checking QR:', error);
      toast.error("Failed to load QR information");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = (qrUserId: string) => {
    if (isListening) return;

    const channel = supabase
      .channel('qr-scans-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qr_scans',
          filter: `qr_user_id=eq.${qrUserId}`
        },
        (payload) => {
          console.log('New scan detected:', payload);
          const newScan = payload.new as ScanEvent;
          setScans(prev => [newScan, ...prev]);
          
          // Show browser notification
          toast.success("🔔 Your QR code was just scanned!", {
            description: `Someone viewed your contact info`,
            duration: 10000,
          });

          // Browser notification (if permission granted)
          if (Notification.permission === "granted") {
            new Notification("QR Code Scanned! 🔔", {
              body: "Someone just scanned your QR code and viewed your contact info",
              icon: "/favicon.ico"
            });
          }
        }
      )
      .subscribe();

    setIsListening(true);

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Browser notifications enabled!");
      }
    }
  };

  useEffect(() => {
    if (qrUser) {
      requestNotificationPermission();
    }
  }, [qrUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    return 'Unknown Browser';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              My QR Code Activity
            </CardTitle>
            <CardDescription>
              Enter your unique code to see scan notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!qrUser ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Unique Code</Label>
                  <Input
                    id="code"
                    placeholder="Enter your 8-character code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={8}
                  />
                </div>
                <Button onClick={checkQR} disabled={loading} className="w-full">
                  {loading ? "Checking..." : "Check My QR"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-semibold">{qrUser.name}</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Bell className="h-3 w-3" />
                    Monitoring
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setQrUser(null);
                    setScans([]);
                    setCode("");
                  }}
                >
                  Check Different Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {qrUser && (
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>
                {scans.length} {scans.length === 1 ? 'scan' : 'scans'} recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No scans yet. Share your QR code to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatDate(scan.scanned_at)}
                          </span>
                        </div>
                        <Badge variant="outline">New</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>IP: {scan.ip_address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Smartphone className="h-3 w-3" />
                        <span>{getBrowserInfo(scan.user_agent || '')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyQR;
