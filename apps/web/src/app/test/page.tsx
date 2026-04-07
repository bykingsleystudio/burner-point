export default function TestPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold text-black">✅ Tailwind Works</h1>
        <p className="text-gray-500 mt-2">CSS pipeline is functioning correctly</p>
        <div className="w-8 h-8 rounded-full bg-green-400 mx-auto mt-6"></div>
        <div className="mt-6 space-y-2 text-sm text-gray-600">
          <p>This white card on black background = styles applied</p>
          <p>Green circle = Tailwind classes processed</p>
        </div>
      </div>
    </div>
  )
}
