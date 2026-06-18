export default function PageLoading() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-500"
        role="status"
        aria-label="Loading"
      />
    </main>
  );
}
