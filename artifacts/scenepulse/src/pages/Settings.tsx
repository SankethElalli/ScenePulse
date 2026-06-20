import {
  useGetProfile,
  useUpdateProfile,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, LocateFixed } from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { detectCity } from "@/lib/geo";

const profileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [detectingCity, setDetectingCity] = useState(false);

  const { data: profile, isLoading } = useGetProfile(user?.id ?? "", {
    query: {
      enabled: !!user?.id,
      queryKey: getGetProfileQueryKey(user?.id ?? ""),
    },
  });

  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      city: "",
      websiteUrl: "",
      avatarUrl: "",
    },
  });

  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (profile && initializedForId.current !== profile.id) {
      initializedForId.current = profile.id;
      form.reset({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        city: profile.city || "",
        websiteUrl: profile.websiteUrl || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    if (!user?.id) return;
    updateProfile.mutate(
      { id: user.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetProfileQueryKey(user.id),
          });
          toast({ title: "Profile updated" });
        },
        onError: () => {
          toast({
            title: "Failed to update profile",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarUploading(true);
    try {
      const url = await uploadFile("Profile", file);
      form.setValue("avatarUrl", url, { shouldDirty: true });
      toast({ title: "Photo uploaded — save to apply" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDetectCity = async () => {
    setDetectingCity(true);
    try {
      const city = await detectCity();
      if (city) {
        form.setValue("city", city, { shouldDirty: true });
      } else {
        toast({
          title: "Could not detect location",
          description: "Allow location access and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setDetectingCity(false);
    }
  };

  const avatarUrl = form.watch("avatarUrl") || profile?.avatarUrl;

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading settings…
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

      <div className="glass p-8 rounded-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <span className="text-3xl font-bold opacity-30">
                      {profile?.displayName?.charAt(0) ||
                        user?.email?.charAt(0)}
                    </span>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  aria-label="Upload profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleAvatarFile(e)}
                />
              </div>
              <div>
                <p className="font-medium">
                  {profile?.displayName || user?.email}
                </p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {avatarUploading ? "Uploading…" : "Change profile photo"}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        className="bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. San Francisco, CA"
                          className="bg-background/50"
                          {...field}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          disabled={detectingCity}
                          onClick={() => void handleDetectCity()}
                          title="Auto-detect my location"
                          className="shrink-0"
                        >
                          {detectingCity ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LocateFixed className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://…"
                      className="bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself…"
                      className="resize-none min-h-[120px] bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
