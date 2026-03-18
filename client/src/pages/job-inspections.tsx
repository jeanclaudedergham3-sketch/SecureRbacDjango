import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdvancedPermissions } from "@/components/rbac/advanced-permission-guard";
import {
  ClipboardList, Camera, Upload, X, CheckCircle, Clock, AlertCircle,
  Send, FileText, Users, Building, MapPin, ChevronRight, Image, Loader2,
  Eye, Pencil, RefreshCw, Info,
} from "lucide-react";

const OVERVIEW_STATUSES = [
  { value: "nt", label: "NT — No Treatment / No Task", color: "bg-gray-100 text-gray-700 border-gray-300", dotColor: "bg-gray-400" },
  { value: "agreed_on_site", label: "Agreed on Site", color: "bg-blue-100 text-blue-700 border-blue-300", dotColor: "bg-blue-500" },
  { value: "needs_proposal", label: "Needs Proposal", color: "bg-amber-100 text-amber-700 border-amber-300", dotColor: "bg-amber-500" },
];

const SUBMISSION_STATUSES = [
  { value: "not_started", label: "Not Started", color: "bg-gray-100 text-gray-600", icon: Clock },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  { value: "waiting", label: "Waiting", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  { value: "in_progress", label: "In Progress", color: "bg-indigo-100 text-indigo-700", icon: RefreshCw },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
];

function overviewLabel(v: string) { return OVERVIEW_STATUSES.find(s => s.value === v)?.label || v; }
function submissionBadge(v: string) {
  const s = SUBMISSION_STATUSES.find(st => st.value === v) || SUBMISSION_STATUSES[0];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}><s.icon className="h-3 w-3" />{s.label}</span>;
}

export default function JobInspections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = useAdvancedPermissions();
  const isAdmin = hasPermission("system.admin") || hasPermission("workorders.edit");

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [form, setForm] = useState({ scopeOfWork: "", technicianRequirements: "", overviewStatus: "nt" });
  const [adminStatusEdit, setAdminStatusEdit] = useState<{ id: number; status: string; notes: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [pendingPhotoUrls, setPendingPhotoUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: workOrders = [] } = useQuery<any[]>({ queryKey: ["/api/work-orders"] });
  const { data: allInspections = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/job-inspections"], refetchInterval: 10000 });

  const selectedWO = workOrders.find((wo: any) => wo.id === selectedWorkOrderId);
  const existingInspection = allInspections.find((i: any) => i.workOrderId === selectedWorkOrderId);

  // When selecting a work order, pre-fill form from existing inspection
  const handleSelectWorkOrder = (wo: any) => {
    setSelectedWorkOrderId(wo.id);
    setPhotoError(null);
    setPendingPhotos([]);
    setPendingPhotoUrls([]);
    const insp = allInspections.find((i: any) => i.workOrderId === wo.id);
    if (insp) {
      setForm({ scopeOfWork: insp.scopeOfWork || "", technicianRequirements: insp.technicianRequirements || "", overviewStatus: insp.overviewStatus || "nt" });
    } else {
      setForm({ scopeOfWork: "", technicianRequirements: "", overviewStatus: "nt" });
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/work-orders/${selectedWorkOrderId}/job-inspection`, data);
      return response as any;
    },
    onSuccess: async (inspection: any) => {
      // Upload pending photos after saving inspection
      if (pendingPhotos.length > 0) {
        setUploadingPhotos(true);
        setPhotoError(null);
        const formData = new FormData();
        pendingPhotos.forEach(f => formData.append("photos", f));
        try {
          const res = await fetch(`/api/job-inspections/${inspection.id}/photos`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          if (!res.ok) throw new Error(await res.text());
        } catch (err: any) {
          setPhotoError(`Failed to upload photos: ${err.message || "Unknown error"}. Please try again.`);
        } finally {
          setUploadingPhotos(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/job-inspections"] });
      toast({ title: "Inspection saved", description: form.overviewStatus === "needs_proposal" ? "Proposal request sent to administrator." : "Inspection saved successfully." });
      setPendingPhotos([]);
      setPendingPhotoUrls([]);
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message || "Failed to save inspection", variant: "destructive" }); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: any) => apiRequest("PATCH", `/api/job-inspections/${id}/status`, { submissionStatus: status, adminNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-inspections"] });
      setAdminStatusEdit(null);
      toast({ title: "Status updated" });
    },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: ({ id, photoPath }: any) => apiRequest("DELETE", `/api/job-inspections/${id}/photos`, { photoPath }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/job-inspections"] }),
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const invalid = files.filter(f => !f.type.startsWith("image/"));
    if (invalid.length > 0) { setPhotoError("Only image files are allowed (JPG, PNG, etc.)"); return; }
    setPhotoError(null);
    setPendingPhotos(prev => [...prev, ...files]);
    setPendingPhotoUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePendingPhoto = (idx: number) => {
    URL.revokeObjectURL(pendingPhotoUrls[idx]);
    setPendingPhotos(prev => prev.filter((_, i) => i !== idx));
    setPendingPhotoUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const existingPhotos = existingInspection ? JSON.parse(existingInspection.photos || "[]") : [];

  // Admin view: list of all submitted inspections
  const submittedInspections = allInspections.filter((i: any) => i.overviewStatus === "needs_proposal");

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">

      {/* ── Left Panel: Work Order List ──────────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r bg-slate-50 flex flex-col">
        <div className="px-4 py-4 border-b bg-white">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Job Inspections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Select a work order to fill an inspection</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {workOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No work orders found</div>
          ) : workOrders.map((wo: any) => {
            const insp = allInspections.find((i: any) => i.workOrderId === wo.id);
            const isSelected = selectedWorkOrderId === wo.id;
            return (
              <button
                key={wo.id}
                onClick={() => handleSelectWorkOrder(wo)}
                className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-600 truncate">{wo.workOrderNumber}</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{wo.clientName}</p>
                    {wo.street && <p className="text-xs text-slate-400 flex items-center gap-0.5 mt-0.5 truncate"><MapPin className="h-3 w-3 flex-shrink-0" />{wo.street}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {insp ? (
                      <>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Filled</span>
                        {submissionBadge(insp.submissionStatus)}
                      </>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Pending</span>
                    )}
                    <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? "text-blue-500" : "text-slate-300"}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Admin: Submitted proposals count */}
        {isAdmin && submittedInspections.length > 0 && (
          <div className="p-3 border-t bg-amber-50">
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {submittedInspections.length} proposal request{submittedInspections.length > 1 ? "s" : ""} need attention
            </p>
          </div>
        )}
      </div>

      {/* ── Right Panel: Form or empty state ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white">
        {!selectedWorkOrderId ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ClipboardList className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Select a work order</p>
            <p className="text-sm mt-1">Choose a work order from the left to fill in an inspection</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-6 space-y-6">

            {/* Work Order Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-300 text-xs font-medium uppercase tracking-wide">Work Order</p>
                  <p className="text-2xl font-bold">{selectedWO?.workOrderNumber}</p>
                  <p className="text-slate-300 mt-0.5">{selectedWO?.clientName}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedWO?.priority === "urgent" ? "bg-red-500 text-white" :
                    selectedWO?.priority === "high" ? "bg-orange-400 text-white" :
                    "bg-yellow-300 text-yellow-900"
                  }`}>{(selectedWO?.priority || "medium").toUpperCase()}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-400 text-white">
                    {(selectedWO?.status || "active").toUpperCase().replace("_", " ")}
                  </span>
                </div>
              </div>
              {selectedWO?.description && (
                <p className="text-slate-300 text-sm mt-3 border-t border-slate-600 pt-3 line-clamp-2">{selectedWO.description}</p>
              )}
            </div>

            {/* Status tracking banner for submitter */}
            {existingInspection && (
              <div className={`rounded-lg border p-4 flex items-start gap-3 ${
                existingInspection.submissionStatus === "completed" ? "bg-green-50 border-green-200" :
                existingInspection.submissionStatus === "in_progress" ? "bg-indigo-50 border-indigo-200" :
                existingInspection.submissionStatus === "waiting" ? "bg-yellow-50 border-yellow-200" :
                existingInspection.submissionStatus === "sent" ? "bg-blue-50 border-blue-200" :
                "bg-gray-50 border-gray-200"
              }`}>
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-slate-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-700">Inspection Status:</span>
                    {submissionBadge(existingInspection.submissionStatus)}
                    <span className="text-xs text-slate-400">Last updated: {new Date(existingInspection.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {existingInspection.adminNotes && (
                    <p className="text-sm text-slate-600 mt-2 bg-white rounded p-2 border"><span className="font-medium">Admin notes:</span> {existingInspection.adminNotes}</p>
                  )}
                </div>
                {/* Admin status update control */}
                {isAdmin && (
                  <Button size="sm" variant="outline" className="text-xs flex-shrink-0" onClick={() => setAdminStatusEdit({ id: existingInspection.id, status: existingInspection.submissionStatus, notes: existingInspection.adminNotes || "" })}>
                    <Pencil className="h-3 w-3 mr-1" /> Update Status
                  </Button>
                )}
              </div>
            )}

            {/* Admin status edit panel */}
            {adminStatusEdit && adminStatusEdit.id === existingInspection?.id && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm text-blue-800">Update Inspection Status (Admin)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <Select value={adminStatusEdit.status} onValueChange={v => setAdminStatusEdit(prev => prev ? { ...prev, status: v } : null)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBMISSION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Admin notes (optional)..."
                    value={adminStatusEdit.notes}
                    onChange={e => setAdminStatusEdit(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    rows={2}
                    className="bg-white text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => statusMutation.mutate(adminStatusEdit)} disabled={statusMutation.isPending}>
                      {statusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                      Save Status
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAdminStatusEdit(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── INSPECTION FORM ─────────────────────────────────────── */}
            <div className="space-y-5">

              {/* 1. Overview / Status Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Overview / Job Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {OVERVIEW_STATUSES.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${form.overviewStatus === opt.value ? opt.color + " border-2 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <input type="radio" name="overviewStatus" value={opt.value} checked={form.overviewStatus === opt.value} onChange={e => setForm(f => ({ ...f, overviewStatus: e.target.value }))} className="sr-only" />
                      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${form.overviewStatus === opt.value ? opt.dotColor : "bg-slate-200"}`} />
                      <span className="text-sm font-medium">{opt.label}</span>
                      {opt.value === "needs_proposal" && <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Auto-sends report</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Scope of Work */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Scope of Work <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Describe the tasks to be performed in detail..."
                  value={form.scopeOfWork}
                  onChange={e => setForm(f => ({ ...f, scopeOfWork: e.target.value }))}
                  rows={5}
                  className="resize-none text-sm"
                />
              </div>

              {/* 3. Technician Requirements */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-500" />
                  Technician Requirements
                </label>
                <Input
                  placeholder="e.g. 2 technicians — $150/hr each, or 'Senior HVAC tech required'"
                  value={form.technicianRequirements}
                  onChange={e => setForm(f => ({ ...f, technicianRequirements: e.target.value }))}
                  className="text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Specify number of technicians, cost, or qualifications needed</p>
              </div>

              {/* 4. Before Photos */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-slate-500" />
                  Before Photos
                </label>

                {/* Existing saved photos */}
                {existingPhotos.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-2">Saved photos ({existingPhotos.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {existingPhotos.map((p: string, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={p} alt={`Before ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-slate-200" onError={e => { (e.target as HTMLImageElement).src = ""; }} />
                          <button
                            onClick={() => deletePhotoMutation.mutate({ id: existingInspection!.id, photoPath: p })}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          ><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending (not yet uploaded) photos */}
                {pendingPhotoUrls.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-2">Pending upload ({pendingPhotoUrls.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {pendingPhotoUrls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={url} alt={`New ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-dashed border-blue-300" />
                          <button onClick={() => removePendingPhoto(idx)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[9px] text-center rounded-b py-0.5">Pending</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  Add Before Photos (tap to select)
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />

                {/* Photo error in red */}
                {photoError && (
                  <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-300 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">{photoError}</p>
                  </div>
                )}
              </div>

              {/* Needs Proposal info banner */}
              {form.overviewStatus === "needs_proposal" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <Send className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Proposal Request will be sent automatically</p>
                    <p className="text-sm text-amber-700 mt-0.5">When you submit, the full report (scope, technician requirements, and all photos) will be packaged and sent to the administrator for review.</p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    if (!form.scopeOfWork.trim()) {
                      toast({ title: "Required", description: "Please fill in the Scope of Work.", variant: "destructive" });
                      return;
                    }
                    submitMutation.mutate(form);
                  }}
                  disabled={submitMutation.isPending || uploadingPhotos}
                  className={`px-6 py-2.5 font-semibold ${form.overviewStatus === "needs_proposal" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {submitMutation.isPending || uploadingPhotos ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{uploadingPhotos ? "Uploading photos..." : "Saving..."}</>
                  ) : form.overviewStatus === "needs_proposal" ? (
                    <><Send className="h-4 w-4 mr-2" />Submit & Send Proposal Request</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" />Save Inspection</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Admin Panel: All Proposal Requests ───────────────────────── */}
      {isAdmin && submittedInspections.length > 0 && !selectedWorkOrderId && (
        <div className="w-96 flex-shrink-0 border-l bg-amber-50 flex flex-col overflow-hidden">
          <div className="px-4 py-4 border-b bg-amber-100">
            <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Proposal Requests ({submittedInspections.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {submittedInspections.map((insp: any) => {
              const wo = workOrders.find((w: any) => w.id === insp.workOrderId);
              const photos = JSON.parse(insp.photos || "[]");
              return (
                <Card key={insp.id} className="border-amber-200 bg-white">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-blue-600">{wo?.workOrderNumber}</p>
                        <p className="text-sm font-semibold text-slate-800">{wo?.clientName}</p>
                      </div>
                      {submissionBadge(insp.submissionStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {insp.scopeOfWork && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase mb-0.5">Scope of Work</p>
                        <p className="text-xs text-slate-700 line-clamp-3">{insp.scopeOfWork}</p>
                      </div>
                    )}
                    {insp.technicianRequirements && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase mb-0.5">Technician Requirements</p>
                        <p className="text-xs text-slate-700">{insp.technicianRequirements}</p>
                      </div>
                    )}
                    {photos.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {photos.slice(0, 3).map((p: string, i: number) => (
                          <img key={i} src={p} alt="" className="w-14 h-14 object-cover rounded border" />
                        ))}
                        {photos.length > 3 && <div className="w-14 h-14 rounded border bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">+{photos.length - 3}</div>}
                      </div>
                    )}
                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 flex-1"
                        onClick={() => handleSelectWorkOrder({ id: insp.workOrderId })}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Select onValueChange={(v) => statusMutation.mutate({ id: insp.id, status: v, notes: insp.adminNotes || "" })}>
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue placeholder="Set Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBMISSION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
