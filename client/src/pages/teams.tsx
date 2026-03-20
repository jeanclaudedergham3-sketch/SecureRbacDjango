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
import { Plus, Users, UserCog, Trash2, Edit, ChevronDown, ChevronRight, Shield } from "lucide-react";

export default function Teams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [addMemberTeamId, setAddMemberTeamId] = useState<number | null>(null);

  const [teamForm, setTeamForm] = useState({ name: "", description: "", leadUserId: "" });
  const [memberUserId, setMemberUserId] = useState("");

  const { data: teams = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/teams"] });
  const { data: allUsers = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const createTeamMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateOpen(false);
      setTeamForm({ name: "", description: "", leadUserId: "" });
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
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      apiRequest("POST", `/api/teams/${teamId}/members`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setAddMemberTeamId(null);
      setMemberUserId("");
      toast({ title: "Member Added", description: "User has been added to the team." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      apiRequest("DELETE", `/api/teams/${teamId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Member Removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getUserName = (user: any) =>
    user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "Unknown User";

  const getUserById = (id: number) => (allUsers as any[]).find((u: any) => u.id === id);

  const openEdit = (team: any) => {
    setEditTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || "",
      leadUserId: team.leadUserId ? String(team.leadUserId) : "",
    });
  };

  const getMemberName = (member: any) => {
    if (member.user) return getUserName(member.user);
    if (member.userId) {
      const u = getUserById(member.userId);
      return u ? getUserName(u) : `User #${member.userId}`;
    }
    if (member.technician) return `${member.technician.firstName} ${member.technician.lastName}`;
    return `Member #${member.id}`;
  };

  const getMemberId = (member: any) => member.userId || member.technicianId;

  const activeUsers = (allUsers as any[]).filter((u: any) => u.isActive !== false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 mt-1">Organize users into teams for work order assignment</p>
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
            <p className="text-gray-400 mb-4">Create your first team to organize users for work orders.</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(teams as any[]).map((team: any) => {
            const leadUser = team.leadUser || (team.leadUserId ? getUserById(team.leadUserId) : null);
            const memberCount = (team.members || []).length;
            return (
              <Card key={team.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
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
                      {leadUser && (
                        <Badge className="bg-blue-100 text-blue-800 ml-2">
                          <UserCog className="h-3 w-3 mr-1" />
                          Lead: {getUserName(leadUser)}
                        </Badge>
                      )}
                      <Badge variant="outline" className="ml-2">
                        {memberCount} member{memberCount !== 1 ? "s" : ""}
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
                    {memberCount === 0 ? (
                      <div className="text-center py-6">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-gray-400 text-sm">No members yet.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => setAddMemberTeamId(team.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Users
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(team.members || []).map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                                {getMemberName(member).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{getMemberName(member)}</div>
                                {(member.user || getUserById(member.userId))?.username && (
                                  <div className="text-xs text-gray-400">
                                    @{(member.user || getUserById(member.userId))?.username}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: getMemberId(member) })}
                              className="text-red-400 hover:text-red-600 transition-colors ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
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
                placeholder="e.g., Field Operations Team"
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
              <Label>Team Lead (User)</Label>
              <Select
                value={teamForm.leadUserId}
                onValueChange={v => setTeamForm(f => ({ ...f, leadUserId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team lead..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team lead</SelectItem>
                  {activeUsers.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {getUserName(u)}
                      {u.username && ` (@${u.username})`}
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
                    leadUserId: teamForm.leadUserId && teamForm.leadUserId !== "none" ? parseInt(teamForm.leadUserId) : null,
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
      <Dialog open={!!addMemberTeamId} onOpenChange={(open) => { if (!open) { setAddMemberTeamId(null); setMemberUserId(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              Add Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select a user to add to this team.</p>
            <div>
              <Label>User *</Label>
              <Select value={memberUserId} onValueChange={setMemberUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.length === 0 ? (
                    <SelectItem value="none" disabled>No users available</SelectItem>
                  ) : (
                    activeUsers.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {getUserName(u)}
                        {u.username && ` — @${u.username}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!memberUserId || addMemberMutation.isPending}
                onClick={() => {
                  if (addMemberTeamId && memberUserId) {
                    addMemberMutation.mutate({ teamId: addMemberTeamId, userId: parseInt(memberUserId) });
                  }
                }}
              >
                {addMemberMutation.isPending ? "Adding..." : "Add Member"}
              </Button>
              <Button variant="outline" onClick={() => { setAddMemberTeamId(null); setMemberUserId(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
