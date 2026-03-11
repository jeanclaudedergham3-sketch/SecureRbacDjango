import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Users, UserCog, Trash2, Edit, ChevronDown, ChevronRight } from "lucide-react";

export default function Teams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [addMemberTeamId, setAddMemberTeamId] = useState<number | null>(null);

  const [teamForm, setTeamForm] = useState({ name: "", description: "", leadTechnicianId: "" });
  const [memberForm, setMemberForm] = useState({ technicianId: "", role: "member" });

  const { data: teams = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/teams"] });
  const { data: technicians = [] } = useQuery<any[]>({ queryKey: ["/api/technicians"] });

  const createTeamMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateOpen(false);
      setTeamForm({ name: "", description: "", leadTechnicianId: "" });
      toast({ title: "Team Created", description: "New team has been created successfully." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/teams/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setEditTeam(null);
      toast({ title: "Team Updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team Deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: number; data: any }) =>
      apiRequest("POST", `/api/teams/${teamId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setAddMemberTeamId(null);
      setMemberForm({ technicianId: "", role: "member" });
      toast({ title: "Member Added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, technicianId }: { teamId: number; technicianId: number }) =>
      apiRequest("DELETE", `/api/teams/${teamId}/members/${technicianId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Member Removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getTechName = (id: number) => {
    const t = (technicians as any[]).find((t: any) => t.id === id);
    return t ? `${t.firstName} ${t.lastName}` : `Tech #${id}`;
  };

  const openEdit = (team: any) => {
    setEditTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || "",
      leadTechnicianId: team.leadTechnicianId ? String(team.leadTechnicianId) : "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">Manage technician teams and team leads for proposals</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading teams...</div>
      ) : (teams as any[]).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Teams Yet</h3>
            <p className="text-gray-400 mb-4">Create your first team to organize technicians.</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(teams as any[]).map((team: any) => (
            <Card key={team.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedTeam === team.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    <div>
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      {team.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{team.description}</p>
                      )}
                    </div>
                    {team.leadTechnicianId && (
                      <Badge className="bg-blue-100 text-blue-800 ml-2">
                        <UserCog className="h-3 w-3 mr-1" />
                        Lead: {getTechName(team.leadTechnicianId)}
                      </Badge>
                    )}
                    <Badge variant="outline" className="ml-2">
                      {(team.members || []).length} member{(team.members || []).length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAddMemberTeamId(team.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(team)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Delete team "${team.name}"?`)) deleteTeamMutation.mutate(team.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedTeam === team.id && (
                <CardContent>
                  {(team.members || []).length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No members yet. Add technicians to this team.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(team.members || []).map((member: any) => {
                        const tech = (technicians as any[]).find((t: any) => t.id === member.technicianId);
                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div>
                              <div className="font-medium text-sm">
                                {tech ? `${tech.firstName} ${tech.lastName}` : `Tech #${member.technicianId}`}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">{member.role || "member"}</div>
                            </div>
                            <button
                              onClick={() => removeMemberMutation.mutate({ teamId: team.id, technicianId: member.technicianId })}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Team Dialog */}
      <Dialog open={isCreateOpen || !!editTeam} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditTeam(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTeam ? "Edit Team" : "Create New Team"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Team Name *</Label>
              <Input
                placeholder="e.g., HVAC Team Alpha"
                value={teamForm.name}
                onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                rows={2}
                value={teamForm.description}
                onChange={e => setTeamForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Team Lead (Technician)</Label>
              <Select
                value={teamForm.leadTechnicianId}
                onValueChange={v => setTeamForm(f => ({ ...f, leadTechnicianId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team lead..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team lead</SelectItem>
                  {(technicians as any[]).map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  const data = {
                    name: teamForm.name,
                    description: teamForm.description || null,
                    leadTechnicianId: teamForm.leadTechnicianId && teamForm.leadTechnicianId !== "none" ? parseInt(teamForm.leadTechnicianId) : null,
                  };
                  if (editTeam) {
                    updateTeamMutation.mutate({ id: editTeam.id, data });
                  } else {
                    createTeamMutation.mutate(data);
                  }
                }}
                disabled={!teamForm.name || createTeamMutation.isPending || updateTeamMutation.isPending}
                className="flex-1"
              >
                {editTeam ? "Update Team" : "Create Team"}
              </Button>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditTeam(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={!!addMemberTeamId} onOpenChange={(open) => { if (!open) setAddMemberTeamId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Technician *</Label>
              <Select
                value={memberForm.technicianId}
                onValueChange={v => setMemberForm(f => ({ ...f, technicianId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician..." />
                </SelectTrigger>
                <SelectContent>
                  {(technicians as any[]).map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={memberForm.role}
                onValueChange={v => setMemberForm(f => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!memberForm.technicianId || addMemberMutation.isPending}
                onClick={() => {
                  if (addMemberTeamId) {
                    addMemberMutation.mutate({
                      teamId: addMemberTeamId,
                      data: { technicianId: parseInt(memberForm.technicianId), role: memberForm.role },
                    });
                  }
                }}
              >
                Add Member
              </Button>
              <Button variant="outline" onClick={() => setAddMemberTeamId(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
