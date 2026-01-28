'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  RefreshCw,
  FileCode,
  FileJson,
  FileText,
  Loader2,
  FolderPlus,
  FilePlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, apiRequest, uploadFile } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { FileInfo } from '@/types/api';

interface FileManagerProps {
  botId: string;
}

function getFileIcon(filename: string, isDirectory: boolean) {
  if (isDirectory) return Folder;

  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
      return FileCode;
    case 'json':
      return FileJson;
    default:
      return FileText;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileManager({ botId }: FileManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const dragCounter = useRef(0);

  // Fetch files in current directory
  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ['files', botId, currentPath],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: FileInfo[] }>(
        `/api/files/${botId}/files`,
        { params: { path: currentPath } }
      );
      return response.data.data;
    },
  });

  // Read file content
  const readFileMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await api.get<{ success: boolean; data: { content: string } }>(
        `/api/files/${botId}/files/content`,
        { params: { path } }
      );
      return response.data.data.content;
    },
    onSuccess: (content) => {
      setFileContent(content);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to read file',
        description: error.response?.data?.error || 'Could not read file',
      });
    },
  });

  // Save file content
  const saveFileMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      await apiRequest('put', `/api/files/${botId}/files/content`, { path, content });
    },
    onSuccess: () => {
      setIsEditing(false);
      toast({
        title: 'File saved',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save file',
        description: error.response?.data?.error || 'Could not save file',
      });
    },
  });

  // Create file/folder
  const createMutation = useMutation({
    mutationFn: async ({ path, isDirectory }: { path: string; isDirectory: boolean }) => {
      await apiRequest('post', `/api/files/${botId}/files/create`, { path, isDirectory });
    },
    onSuccess: () => {
      setShowCreateDialog(false);
      setNewItemName('');
      queryClient.invalidateQueries({ queryKey: ['files', botId, currentPath] });
      toast({
        title: createType === 'folder' ? 'Folder created' : 'File created',
        description: `Successfully created ${newItemName}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create',
        description: error.response?.data?.error || 'Could not create item',
      });
    },
  });

  // Delete file/folder
  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      await api.delete(`/api/files/${botId}/files`, { params: { path } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', botId] });
      if (selectedFile) {
        setSelectedFile(null);
        setFileContent('');
      }
      toast({
        title: 'Deleted',
        description: 'Item has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete',
        description: error.response?.data?.error || 'Could not delete item',
      });
    },
  });

  // Rename file/folder
  const renameMutation = useMutation({
    mutationFn: async ({ oldPath, newPath }: { oldPath: string; newPath: string }) => {
      await apiRequest('patch', `/api/files/${botId}/files/rename`, { oldPath, newPath });
    },
    onSuccess: () => {
      setShowRenameDialog(false);
      setRenameTarget(null);
      setNewName('');
      queryClient.invalidateQueries({ queryKey: ['files', botId] });
      toast({
        title: 'Renamed',
        description: 'Item has been renamed.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to rename',
        description: error.response?.data?.error || 'Could not rename item',
      });
    },
  });

  const handleFileClick = useCallback((file: FileInfo) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      setSelectedFile(null);
      setFileContent('');
      setIsEditing(false);
    } else {
      setSelectedFile(file);
      readFileMutation.mutate(file.path);
      setIsEditing(false);
    }
  }, [readFileMutation]);

  const uploadSingleFile = useCallback(async (file: File) => {
    try {
      setUploadProgress(0);
      await uploadFile(
        `/api/files/${botId}/files/upload?path=${encodeURIComponent(currentPath)}`,
        file,
        setUploadProgress
      );
      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: `Failed to upload ${file.name}: ${error.response?.data?.error || 'Unknown error'}`,
      });
      return false;
    }
  }, [botId, currentPath, toast]);

  const processUploadQueue = useCallback(async (filesToUpload: File[]) => {
    setUploadQueue(filesToUpload);
    setCurrentUploadIndex(0);

    for (let i = 0; i < filesToUpload.length; i++) {
      setCurrentUploadIndex(i);
      await uploadSingleFile(filesToUpload[i]);
    }

    setUploadProgress(null);
    setUploadQueue([]);
    setCurrentUploadIndex(0);
    queryClient.invalidateQueries({ queryKey: ['files', botId, currentPath] });

    toast({
      title: 'Upload complete',
      description: `${filesToUpload.length} file(s) uploaded successfully.`,
    });
  }, [uploadSingleFile, queryClient, botId, currentPath, toast]);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesToUpload = Array.from(fileList);
    await processUploadQueue(filesToUpload);

    // Reset input
    event.target.value = '';
  }, [processUploadQueue]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const filesToUpload = Array.from(files);
      await processUploadQueue(filesToUpload);
    }
  }, [processUploadQueue]);

  const navigateUp = useCallback(() => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
    setSelectedFile(null);
    setFileContent('');
  }, [currentPath]);

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="grid h-[600px] grid-cols-1 gap-4 lg:grid-cols-2">
      {/* File Browser */}
      <Card
        className={`flex flex-col relative transition-all ${
          isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-primary/20 backdrop-blur-sm">
            <Upload className="h-12 w-12 text-primary animate-bounce" />
            <p className="mt-4 text-lg font-medium text-primary">Drop files here to upload</p>
            <p className="text-sm text-muted-foreground">Files will be uploaded to current directory</p>
          </div>
        )}

        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Files</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCreateType('folder');
                setShowCreateDialog(true);
              }}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCreateType('file');
                setShowCreateDialog(true);
              }}
            >
              <FilePlus className="h-4 w-4" />
            </Button>
            <label>
              <Button variant="ghost" size="icon" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                multiple
              />
            </label>
          </div>
        </CardHeader>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 border-b border-white/10 px-4 pb-2 text-sm">
          <button
            onClick={() => {
              setCurrentPath('');
              setSelectedFile(null);
              setFileContent('');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            root
          </button>
          {pathParts.map((part, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => {
                  const newPath = pathParts.slice(0, index + 1).join('/');
                  setCurrentPath(newPath);
                  setSelectedFile(null);
                  setFileContent('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Upload Progress */}
        {uploadProgress !== null && (
          <div className="border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Uploading {uploadQueue.length > 1
                  ? `(${currentUploadIndex + 1}/${uploadQueue.length}) ${uploadQueue[currentUploadIndex]?.name}`
                  : uploadQueue[0]?.name || 'file'
                }... {uploadProgress}%
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {currentPath && (
              <button
                onClick={navigateUp}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/5"
              >
                <FolderOpen className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">..</span>
              </button>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : files?.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Upload className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No files yet</p>
                <p className="text-sm">Drag & drop files here or click upload</p>
              </div>
            ) : (
              files?.filter((file) => {
                // Hide node_modules, __pycache__, and other common ignored folders
                const hiddenFolders = ['node_modules', '__pycache__', '.git', '.venv', 'venv'];
                return !hiddenFolders.includes(file.name);
              }).map((file) => {
                const Icon = getFileIcon(file.name, file.isDirectory);
                const isSelected = selectedFile?.path === file.path;

                return (
                  <ContextMenu key={file.path}>
                    <ContextMenuTrigger>
                      <button
                        onClick={() => handleFileClick(file)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/5 ${
                          isSelected ? 'bg-white/10' : ''
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            file.isDirectory ? 'text-yellow-500' : 'text-blue-400'
                          }`}
                        />
                        <span className="flex-1 truncate">{file.name}</span>
                        {!file.isDirectory && (
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        )}
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          setRenameTarget(file);
                          setNewName(file.name);
                          setShowRenameDialog(true);
                        }}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => deleteMutation.mutate(file.path)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* File Editor */}
      <Card className="flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">
            {selectedFile ? selectedFile.name : 'Editor'}
          </CardTitle>
          {selectedFile && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      readFileMutation.mutate(selectedFile.path);
                    }}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      saveFileMutation.mutate({
                        path: selectedFile.path,
                        content: fileContent,
                      })
                    }
                    disabled={saveFileMutation.isPending}
                  >
                    {saveFileMutation.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {selectedFile ? (
            readFileMutation.isPending ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isEditing ? (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm focus:outline-none"
                spellCheck={false}
              />
            ) : (
              <ScrollArea className="h-full">
                <pre className="p-4 font-mono text-sm">
                  <code>{fileContent}</code>
                </pre>
              </ScrollArea>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <File className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">Select a file to view</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'folder' ? 'Folder' : 'File'}
            </DialogTitle>
            <DialogDescription>
              Enter a name for the new {createType}.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={createType === 'folder' ? 'folder-name' : 'filename.js'}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const path = currentPath
                  ? `${currentPath}/${newItemName}`
                  : newItemName;
                createMutation.mutate({ path, isDirectory: createType === 'folder' });
              }}
              disabled={!newItemName || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for {renameTarget?.name}.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renameTarget) {
                  const pathParts = renameTarget.path.split('/');
                  pathParts.pop();
                  const newPath = [...pathParts, newName].join('/');
                  renameMutation.mutate({
                    oldPath: renameTarget.path,
                    newPath: newPath || newName,
                  });
                }
              }}
              disabled={!newName || renameMutation.isPending}
            >
              {renameMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Edit2 className="mr-2 h-4 w-4" />
              )}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
