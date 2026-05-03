import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Settings, Upload, Trash2, CheckCircle2, Loader2, ImageIcon, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/contexts/system-settings";
import { apiRequest } from "@/lib/queryClient";

export default function SystemSettings() {
  const { systemName, logoUrl, refresh } = useSystemSettings();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nameInput, setNameInput] = useState(systemName);
  const [nameSaved, setNameSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Keep nameInput in sync if context changes (e.g. on first load)
  const [synced, setSynced] = useState(false);
  if (!synced && systemName !== "NOVIQ") { setNameInput(systemName); setSynced(true); }

  // ── Save system name ─────────────────────────────────────────────────────
  const nameMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("PATCH", "/api/settings/system", { systemName: name }),
    onSuccess: async () => {
      await refresh();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
      toast({ title: "System name updated" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  // ── Upload logo ──────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  async function handleLogoUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      setLogoPreview(null);
      await refresh();
      toast({ title: "Logo updated" });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  // ── Remove logo ──────────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: () => fetch("/api/settings/logo", { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: async () => {
      setLogoPreview(null);
      await refresh();
      toast({ title: "Logo removed" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const effectiveLogoUrl = logoPreview || logoUrl;
  const isWorking = nameMutation.isPending || uploading || removeMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-slate-700 rounded-xl">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize the name and logo shown throughout the system</p>
        </div>
      </div>

      {/* ── System Name ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">System Name</CardTitle>
          <CardDescription>Shown in the sidebar, login page, and browser tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sysname">Name</Label>
            <div className="flex gap-2">
              <Input
                id="sysname"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setNameSaved(false); }}
                placeholder="NOVIQ"
                maxLength={40}
                className="flex-1"
              />
              <Button
                onClick={() => nameMutation.mutate(nameInput.trim() || "NOVIQ")}
                disabled={nameMutation.isPending || nameInput.trim() === systemName}
                className="gap-2 min-w-[100px]"
              >
                {nameMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : nameSaved ? (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Saved</>
                ) : "Save"}
              </Button>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl bg-slate-800 px-4 py-3 flex items-center gap-3">
            <span className="text-xs text-slate-400 shrink-0">Preview:</span>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow ring-2 ring-blue-400/20 shrink-0">
              {effectiveLogoUrl ? (
                <img src={effectiveLogoUrl} alt="logo" className="w-5 h-5 object-contain" />
              ) : (
                <Shield className="h-4 w-4 text-white" />
              )}
            </div>
            <span className="text-white font-bold text-base truncate">{nameInput || "NOVIQ"}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Logo ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">System Logo</CardTitle>
          <CardDescription>Replaces the default shield icon in the sidebar and login page. PNG, JPG, SVG or WebP, max 5 MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
              {effectiveLogoUrl ? (
                <img src={effectiveLogoUrl} alt="logo" className="w-12 h-12 object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                  <span className="text-[10px] text-slate-400">No logo</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload Image"}
              </Button>
              {logoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate()}
                >
                  {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Remove Logo
                </Button>
              )}
              {!logoUrl && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Default shield icon is used
                </p>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              // Show preview immediately
              const reader = new FileReader();
              reader.onload = ev => setLogoPreview(ev.target?.result as string);
              reader.readAsDataURL(file);
              handleLogoUpload(file);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      {/* ── Reset to defaults ───────────────────────────────── */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-400 hover:text-gray-600"
          disabled={isWorking}
          onClick={async () => {
            await Promise.all([
              apiRequest("PATCH", "/api/settings/system", { systemName: "NOVIQ", logoUrl: "" }),
              fetch("/api/settings/logo", { method: "DELETE", credentials: "include" }),
            ]);
            setNameInput("NOVIQ");
            setLogoPreview(null);
            await refresh();
            toast({ title: "Settings reset to defaults" });
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
