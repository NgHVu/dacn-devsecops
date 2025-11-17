import Navbar from "@/components/layout/Navbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {children} 
      </main>
      
    </div>
  );
}