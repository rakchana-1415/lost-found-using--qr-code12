import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Scan = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; phone: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError('Invalid QR code');
      setLoading(false);
      return;
    }

    const logScan = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('log-scan', {
          body: { uniqueCode: code }
        });

        if (error) throw error;

        setOwnerInfo(data);
      } catch (err: any) {
        console.error('Error logging scan:', err);
        setError('QR code not found or invalid');
      } finally {
        setLoading(false);
      }
    };

    logScan();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ownerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Failed to load owner information'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Item Found! 🎉</CardTitle>
          <CardDescription>
            Contact the owner to return their item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <User className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Owner Name</p>
              <p className="text-lg font-semibold">{ownerInfo.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
              <p className="text-lg font-semibold">{ownerInfo.phone}</p>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={() => window.location.href = `tel:${ownerInfo.phone}`}
          >
            <Phone className="mr-2 h-4 w-4" />
            Call Owner
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            The owner has been notified that their QR code was scanned
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scan;
