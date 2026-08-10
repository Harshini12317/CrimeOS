export default function ComplaintsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Remove the fixed aside sidebar here */}
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
