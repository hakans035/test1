import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog } from "lucide-react";
import { auth } from "@/lib/firebase";

interface Member {
  uid: string;
  email: string;
  role: string;
}

export default function MemberManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['/api/admin/members'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/members', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      return response.json();
    }
  });

  // Update member role
  const updateRole = useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: string }) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/members/role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/members'] });
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                No members found
              </TableCell>
            </TableRow>
          ) : (
            members?.map((member: Member) => (
              <TableRow key={member.uid}>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                    member.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {member.role}
                  </span>
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={member.role}
                    onValueChange={(value) => {
                      updateRole.mutate({ uid: member.uid, role: value });
                    }}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}