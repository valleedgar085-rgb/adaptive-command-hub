import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, FileText, Globe, HardDrive, Clock, MapPin } from "lucide-react";

export type PermissionType = 
  | "file-read" 
  | "file-write" 
  | "network" 
  | "storage" 
  | "timer"
  | "clipboard"
  | "geolocation";

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: PermissionType;
  details?: string;
  onAllow: () => void;
  onDeny: () => void;
}

const permissionConfig: Record<PermissionType, { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  warning: string;
}> = {
  "file-read": {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: "File Read Access",
    description: "This script wants to read files from your system.",
    warning: "Only allow if you trust this script."
  },
  "file-write": {
    icon: <FileText className="h-6 w-6 text-yellow-500" />,
    title: "File Write Access",
    description: "This script wants to write files to your system.",
    warning: "This could modify or create files on your device."
  },
  "network": {
    icon: <Globe className="h-6 w-6 text-blue-500" />,
    title: "Network Access",
    description: "This script wants to make network requests.",
    warning: "Data may be sent to external servers."
  },
  "storage": {
    icon: <HardDrive className="h-6 w-6 text-green-500" />,
    title: "Local Storage Access",
    description: "This script wants to access browser storage.",
    warning: "This allows reading and writing local data."
  },
  "timer": {
    icon: <Clock className="h-6 w-6 text-purple-500" />,
    title: "Timer/Interval Access",
    description: "This script wants to run background timers.",
    warning: "Code will continue running in the background."
  },
  "clipboard": {
    icon: <FileText className="h-6 w-6 text-orange-500" />,
    title: "Clipboard Access",
    description: "This script wants to access your clipboard.",
    warning: "This can read or modify clipboard contents."
  },
  "geolocation": {
    icon: <MapPin className="h-6 w-6 text-red-500" />,
    title: "Location Access",
    description: "This script wants to access your location.",
    warning: "Your geographic location will be shared."
  }
};

export const PermissionDialog = ({
  open,
  onOpenChange,
  permission,
  details,
  onAllow,
  onDeny
}: PermissionDialogProps) => {
  const config = permissionConfig[permission];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/30">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-muted/50">
              {config.icon}
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <AlertDialogTitle className="text-xl font-bold">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="text-foreground/80">{config.description}</p>
            {details && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs text-muted-foreground">
                {details}
              </div>
            )}
            <p className="text-yellow-500 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {config.warning}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={onDeny}
            className="bg-destructive/20 border-destructive/50 text-destructive hover:bg-destructive/30"
          >
            Deny
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onAllow}
            className="bg-primary hover:bg-primary/90"
          >
            Allow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
