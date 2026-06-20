import { useState } from "react";
import {
  useGetProfile,
  getGetProfileQueryKey,
  useGetFollowStatus,
  useFollowArtist,
  useUnfollowArtist,
  useGetMyArtist,
  useCreateCollaborationRequest,
  getGetFollowStatusQueryKey,
  getGetMyArtistQueryKey,
  getListFollowedArtistsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Users } from "lucide-react";

export function ArtistActions({ artistId }: { artistId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile } = useGetProfile(user?.id ?? "", {
    query: {
      enabled: !!user?.id,
      queryKey: getGetProfileQueryKey(user?.id ?? ""),
    },
  });

  const { data: followStatus } = useGetFollowStatus(
    profile?.id ?? "",
    artistId,
    {
      query: {
        enabled: !!profile?.id,
        queryKey: getGetFollowStatusQueryKey(profile?.id ?? "", artistId),
      },
    },
  );
  const followArtist = useFollowArtist();
  const unfollowArtist = useUnfollowArtist();

  const { data: myArtist } = useGetMyArtist(profile?.id ?? "", {
    query: {
      enabled: profile?.role === "artist" && !!profile?.id,
      retry: false,
      queryKey: getGetMyArtistQueryKey(profile?.id ?? ""),
    },
  });

  const createCollab = useCreateCollaborationRequest();
  const [collabOpen, setCollabOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (!user || !profile) return null;

  const following = followStatus?.following ?? false;
  const toggling = followArtist.isPending || unfollowArtist.isPending;

  const invalidateFollow = () => {
    void qc.invalidateQueries({
      queryKey: getGetFollowStatusQueryKey(profile.id, artistId),
    });
    void qc.invalidateQueries({
      queryKey: getListFollowedArtistsQueryKey(profile.id),
    });
  };

  const toggleFollow = () => {
    if (following) {
      unfollowArtist.mutate(
        { id: profile.id, artistId },
        { onSuccess: () => void invalidateFollow() },
      );
    } else {
      followArtist.mutate(
        { id: profile.id, artistId },
        { onSuccess: () => void invalidateFollow() },
      );
    }
  };

  const canRequestCollab =
    profile.role === "artist" && myArtist && myArtist.id !== artistId;

  const submitCollab = () => {
    if (!myArtist) return;
    createCollab.mutate(
      {
        data: {
          fromArtistId: myArtist.id,
          toArtistId: artistId,
          message: message.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Collaboration request sent" });
          setCollabOpen(false);
          setMessage("");
        },
        onError: () =>
          toast({
            title: "Could not send request",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <>
      <Button
        variant={following ? "outline" : "default"}
        size="sm"
        onClick={toggleFollow}
        disabled={toggling}
        data-testid="button-follow"
      >
        <Heart
          className={`w-4 h-4 mr-2 ${following ? "fill-current" : ""}`}
        />
        {following ? "Following" : "Follow"}
      </Button>

      {canRequestCollab && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setCollabOpen(true)}
          data-testid="button-request-collab"
        >
          <Users className="w-4 h-4 mr-2" /> Request collab
        </Button>
      )}

      <Dialog open={collabOpen} onOpenChange={setCollabOpen}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Request a collaboration</DialogTitle>
            <DialogDescription>
              Send a message to this artist about working together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="collab-message">Message (optional)</Label>
            <Textarea
              id="collab-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Tell them what you have in mind…"
              className="bg-background/50"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCollabOpen(false)}
              disabled={createCollab.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={submitCollab}
              disabled={createCollab.isPending}
              data-testid="button-send-collab"
            >
              {createCollab.isPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
