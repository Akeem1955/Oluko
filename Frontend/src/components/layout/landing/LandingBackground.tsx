export const LandingBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transform-gpu">
    <div className="absolute inset-0 bg-background-light dark:bg-[#02040c]" />

    {/* Optimized Ambient Glows - Reduced count and simplified blurs */}
    <div className="absolute inset-0 opacity-10 dark:opacity-30 will-change-transform">
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.1)_0%,transparent_70%)] blur-[100px]" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] blur-[90px]" />
    </div>

    {/* Primary Hero Gradients */}
    <div className="absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_0%,rgba(59,130,246,0.12)_0%,transparent_100%)] dark:bg-[radial-gradient(50%_45%_at_50%_0%,rgba(37,99,235,0.15)_0%,transparent_100%)]" />

    {/* Refined Grid Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[6rem_6rem]" />

    {/* Subtle Noise Texture */}
    <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
  </div>
);
