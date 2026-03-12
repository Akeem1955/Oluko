import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Palette, HelpCircle, LogOut, Upload } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/lib/hooks/theme/useTheme";
import { cn } from "@/lib/utils/utils";
import { authService } from "@/lib/services/authService";
import { useAuthStore } from "@/lib/store/authStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useNavigate } from "react-router-dom";

const MENU_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useTheme();
  const { user, checkAuth, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast("File too large. Max 2MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      await authService.updateProfile({ base64Image: selectedImage });
      await checkAuth();
      setSelectedImage(null);
      addToast("Profile updated successfully!", "success");
    } catch (e) {
      console.error("Update failed", e);
      addToast("Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1440px] mx-auto p-6 lg:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your account preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-4">
              <nav className="space-y-1">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      activeTab === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </nav>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            {activeTab === "profile" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Profile Settings
                </h2>
                <div className="flex items-center gap-6 mb-8">
                  <Avatar
                    src={selectedImage || user?.profilePicture}
                    alt={user?.fullName || "User"}
                    size="lg"
                    ring
                  />
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                      onChange={handleImageSelect}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Change Photo
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={user?.fullName || ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 opacity-70 cursor-not-allowed"
                  />
                  <Input
                    label="Email"
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 opacity-70 cursor-not-allowed"
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSaveChanges}
                    loading={loading}
                    disabled={!selectedImage}
                  >
                    Save Changes
                  </Button>
                </div>
              </Card>
            )}

            {activeTab === "appearance" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Appearance
                </h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose your preferred theme
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {(["light", "dark"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "p-4 rounded-xl cursor-pointer border-2 transition-all text-center",
                          theme === t
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 dark:border-gray-700 hover:border-primary/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-full h-20 rounded-lg mb-3",
                            t === "light" && "bg-white border border-gray-200",
                            t === "dark" && "bg-gray-800",
                          )}
                        />
                        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                          {t}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "help" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Help & Support
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      How do I use the app?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Start by navigating to the Dashboard. You can choose from
                      various tutors like YouTube or PDF. Track your progress
                      and keep your streak alive!
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Useful Tips</h3>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Set a realistic weekly goal to stay motivated.</li>
                      <li>Use the "Teach Me" mode for difficult concepts.</li>
                      <li>
                        Upload your course materials to the PDF Tutor for quick
                        summaries.
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
