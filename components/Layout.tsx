import { Menu } from "@/components/Menu";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Menu />

      <main className="p-6">
        {children}
      </main>
    </div>
  );
}