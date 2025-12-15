import { useState, useCallback } from "react";
import { 
  FolderOpen, 
  FileUp, 
  FilePlus, 
  Download,
  File,
  Folder,
  X,
  Check,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PermissionDialog, PermissionType } from "./PermissionDialog";

export interface FileSystemFile {
  name: string;
  content: string;
  type: string;
  size: number;
  lastModified: number;
}

interface FileSystemAccessProps {
  onFileRead?: (file: FileSystemFile) => void;
  onFileWrite?: (success: boolean, fileName: string) => void;
}

export const useFileSystem = () => {
  const [pendingPermission, setPendingPermission] = useState<{
    type: PermissionType;
    details: string;
    resolve: (granted: boolean) => void;
  } | null>(null);
  const [grantedPermissions, setGrantedPermissions] = useState<Set<PermissionType>>(new Set());
  const { toast } = useToast();

  const requestPermission = useCallback((type: PermissionType, details: string): Promise<boolean> => {
    if (grantedPermissions.has(type)) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      setPendingPermission({ type, details, resolve });
    });
  }, [grantedPermissions]);

  const handlePermissionResponse = useCallback((granted: boolean) => {
    if (pendingPermission) {
      if (granted) {
        setGrantedPermissions(prev => new Set([...prev, pendingPermission.type]));
      }
      pendingPermission.resolve(granted);
      setPendingPermission(null);
    }
  }, [pendingPermission]);

  const readFile = useCallback(async (): Promise<FileSystemFile | null> => {
    const hasPermission = await requestPermission("file-read", "Read a file from your computer");
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "File read access was not granted",
        variant: "destructive"
      });
      return null;
    }

    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.js,.ts,.json,.md,.html,.css,.py,.jsx,.tsx";
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const content = await file.text();
        resolve({
          name: file.name,
          content,
          type: file.type || "text/plain",
          size: file.size,
          lastModified: file.lastModified
        });
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }, [requestPermission, toast]);

  const readMultipleFiles = useCallback(async (): Promise<FileSystemFile[]> => {
    const hasPermission = await requestPermission("file-read", "Read multiple files from your computer");
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "File read access was not granted",
        variant: "destructive"
      });
      return [];
    }

    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = ".txt,.js,.ts,.json,.md,.html,.css,.py,.jsx,.tsx";
      
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve([]);
          return;
        }

        const results: FileSystemFile[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const content = await file.text();
          results.push({
            name: file.name,
            content,
            type: file.type || "text/plain",
            size: file.size,
            lastModified: file.lastModified
          });
        }
        resolve(results);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }, [requestPermission, toast]);

  const writeFile = useCallback(async (fileName: string, content: string, mimeType = "text/plain"): Promise<boolean> => {
    const hasPermission = await requestPermission("file-write", `Save file: "${fileName}"`);
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "File write access was not granted",
        variant: "destructive"
      });
      return false;
    }

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "File Saved",
        description: `"${fileName}" has been downloaded`
      });
      return true;
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save the file",
        variant: "destructive"
      });
      return false;
    }
  }, [requestPermission, toast]);

  const readDirectory = useCallback(async (): Promise<FileSystemFile[]> => {
    const hasPermission = await requestPermission("file-read", "Read a folder from your computer");
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "Directory read access was not granted",
        variant: "destructive"
      });
      return [];
    }

    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.webkitdirectory = true;
      
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve([]);
          return;
        }

        const results: FileSystemFile[] = [];
        const allowedExtensions = [".txt", ".js", ".ts", ".json", ".md", ".html", ".css", ".py", ".jsx", ".tsx"];
        
        for (let i = 0; i < Math.min(files.length, 50); i++) {
          const file = files[i];
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          
          if (allowedExtensions.includes(ext)) {
            const content = await file.text();
            results.push({
              name: file.webkitRelativePath || file.name,
              content,
              type: file.type || "text/plain",
              size: file.size,
              lastModified: file.lastModified
            });
          }
        }
        resolve(results);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }, [requestPermission, toast]);

  return {
    readFile,
    readMultipleFiles,
    writeFile,
    readDirectory,
    pendingPermission,
    handlePermissionResponse,
    grantedPermissions
  };
};

export const FileSystemAccess = ({ onFileRead, onFileWrite }: FileSystemAccessProps) => {
  const {
    readFile,
    readMultipleFiles,
    writeFile,
    readDirectory,
    pendingPermission,
    handlePermissionResponse,
    grantedPermissions
  } = useFileSystem();

  const handleReadFile = async () => {
    const file = await readFile();
    if (file && onFileRead) {
      onFileRead(file);
    }
  };

  const handleReadMultiple = async () => {
    const files = await readMultipleFiles();
    files.forEach(file => onFileRead?.(file));
  };

  const handleReadDirectory = async () => {
    const files = await readDirectory();
    files.forEach(file => onFileRead?.(file));
  };

  return (
    <>
      <PermissionDialog
        open={!!pendingPermission}
        onOpenChange={(open) => !open && handlePermissionResponse(false)}
        permission={pendingPermission?.type || "file-read"}
        details={pendingPermission?.details || ""}
        onAllow={() => handlePermissionResponse(true)}
        onDeny={() => handlePermissionResponse(false)}
      />

      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
        <span className="text-xs text-muted-foreground font-medium mr-2">File System:</span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReadFile}
          className="h-7 text-xs gap-1.5"
        >
          <File className="h-3 w-3" />
          Open File
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReadMultiple}
          className="h-7 text-xs gap-1.5"
        >
          <FileUp className="h-3 w-3" />
          Open Multiple
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReadDirectory}
          className="h-7 text-xs gap-1.5"
        >
          <FolderOpen className="h-3 w-3" />
          Open Folder
        </Button>

        {grantedPermissions.size > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <Check className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-500">
              {grantedPermissions.size} permission(s) granted
            </span>
          </div>
        )}
      </div>
    </>
  );
};
