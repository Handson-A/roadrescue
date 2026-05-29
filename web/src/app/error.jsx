'use client';

export default function Error({
  error,
  reset,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">
          Something went wrong
        </h2>

        <button
          onClick={() => reset()}
          className="rounded-xl bg-primary px-4 py-3 text-white"
        >
          Retry
        </button>
      </div>
    </div>
  )
}