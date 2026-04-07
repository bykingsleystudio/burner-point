export default function Home() {
  return (
    <main className="min-h-screen bg-[#013220] text-white font-sans">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-6xl font-bold mb-4 text-[#00FF9D]">🔐 BURNER POINT</h1>
        <p className="text-xl mb-2">Private by Design.</p>
        <p className="text-xl mb-8">Stay Anonymous. Stay Connected.</p>
        <div className="text-2xl mb-8">
          Don't want to give out your phone number?<br />
          No problem. Use ours.
        </div>
        <p className="text-lg mb-8">
          Generate secure, non-VoIP numbers instantly and stay in control of your communication — anytime, anywhere.
        </p>
        <div className="flex gap-4 mb-8">
          <button className="bg-[#00FF9D] text-black px-6 py-3 rounded font-bold hover:bg-[#39FF14] transition">Get Started</button>
          <button className="border border-[#00FF9D] text-[#00FF9D] px-6 py-3 rounded font-bold hover:bg-[#00FF9D] hover:text-black transition">Learn More</button>
        </div>
        <p className="text-lg">Receive SMS, Voice, and OTP verifications from 900+ platforms worldwide.</p>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-black">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">How It Works</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="bg-[#013220] p-6 rounded">
            <div className="text-6xl text-[#39FF14] mb-4">1</div>
            <p>Choose your number (country + area code)</p>
          </div>
          <div className="bg-[#013220] p-6 rounded">
            <div className="text-6xl text-[#39FF14] mb-4">2</div>
            <p>Use it for verification, calls, or messaging</p>
          </div>
          <div className="bg-[#013220] p-6 rounded">
            <div className="text-6xl text-[#39FF14] mb-4">3</div>
            <p>Receive SMS, OTP, or voice instantly</p>
          </div>
          <div className="bg-[#013220] p-6 rounded">
            <div className="text-6xl text-[#39FF14] mb-4">4</div>
            <p>Let it expire — or keep it as long as you want</p>
          </div>
        </div>
        <p className="text-center text-xl mt-12 text-[#00FF9D]">Simple. Secure. Controlled.</p>
      </section>

      {/* Why Burner Point */}
      <section className="py-16 px-4 bg-[#013220]">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">Why Burner Point</h2>
        <ul className="max-w-2xl mx-auto text-lg space-y-4">
          <li>✅ Real mobile numbers backed by physical SIMs</li>
          <li>✅ Works across all platforms and services</li>
          <li>✅ Fast, reliable verification delivery</li>
          <li>✅ Full privacy — no personal exposure</li>
          <li>✅ Built for global access and flexibility</li>
        </ul>
        <p className="text-center text-xl mt-12 text-[#00FF9D]">Private by Design.</p>
      </section>

      {/* What We Offer */}
      <section className="py-16 px-4 bg-black">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">What We Offer</h2>
        <p className="text-center mb-8">Burner Point provides secure communication solutions for individuals and businesses who value privacy, speed, and control.</p>
        <ul className="max-w-2xl mx-auto text-lg space-y-2">
          <li>🔹 Non-VoIP phone numbers</li>
          <li>🔹 SMS & OTP verification</li>
          <li>🔹 Voice call verification</li>
          <li>🔹 Temporary & long-term rentals</li>
          <li>🔹 Multi-country number access</li>
          <li>🔹 Social and platform verification support</li>
        </ul>
      </section>

      {/* Loved by Users */}
      <section className="py-16 px-4 bg-[#013220]">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">Loved by Users Worldwide</h2>
        <p className="text-center text-xl">Millions trust Burner Point to communicate, verify, and stay connected — without exposing their real number.</p>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-black">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">Pricing Section</h2>
        <p className="text-center mb-8">Great products. Simple pricing.</p>
        <p className="text-center mb-12">Purchase numbers or credits using secure payment options and choose the plan that fits your needs.</p>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#013220] p-8 rounded border border-[#00FF9D]">
            <h3 className="text-2xl font-bold mb-4 text-[#00FF9D]">Verifications</h3>
            <p className="text-xl mb-4 text-[#39FF14]">Starting at $0.99 / verification</p>
            <ul className="space-y-2">
              <li>Receive SMS or OTP codes instantly</li>
              <li>Verify accounts across any platform</li>
              <li>Works with WhatsApp, Telegram, Gmail, Tinder, and more</li>
            </ul>
          </div>
          <div className="bg-[#013220] p-8 rounded border border-[#00FF9D]">
            <h3 className="text-2xl font-bold mb-4 text-[#00FF9D]">Non-Renewable Rentals (1–14 Days)</h3>
            <p className="text-xl mb-4 text-[#39FF14]">Starting at $5.99 / rental</p>
            <ul className="space-y-2">
              <li>Use for any service</li>
              <li>Own your number temporarily</li>
              <li>Unlimited SMS verifications</li>
              <li>Instant access 24/7</li>
            </ul>
          </div>
          <div className="bg-[#013220] p-8 rounded border border-[#00FF9D]">
            <h3 className="text-2xl font-bold mb-4 text-[#00FF9D]">Renewable Rentals (Monthly)</h3>
            <p className="text-xl mb-4 text-[#39FF14]">Starting at $15.99 / month</p>
            <ul className="space-y-2">
              <li>Keep your number as long as you want</li>
              <li>Unlimited SMS & voice verifications</li>
              <li>Multi-service verification on one line</li>
              <li>Choose any country or area code</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Conversation Section */}
      <section className="py-16 px-4 bg-[#013220]">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">Conversation Section (Calls & Messaging)</h2>
        <p className="text-center mb-8">Millions use Burner Point to call and text over WiFi or data — no SIM or airtime required.</p>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-4 text-[#00FF9D]">Features:</h3>
          <ul className="space-y-2 text-lg">
            <li><strong className="text-[#39FF14]">Free Phone Number:</strong> Choose your own U.S. number and start communicating instantly.</li>
            <li><strong className="text-[#39FF14]">Free Texting:</strong> Unlimited texting to U.S. numbers.</li>
            <li><strong className="text-[#39FF14]">WiFi / Data Calling:</strong> Call and text without using cellular minutes.</li>
            <li><strong className="text-[#39FF14]">Full Communication Suite:</strong> SMS • MMS • Calls • Voicemail — all in one place.</li>
            <li><strong className="text-[#39FF14]">No Roaming Fees:</strong> Use Burner Point globally without extra charges.</li>
            <li><strong className="text-[#39FF14]">Cross-Platform Access:</strong> Available on iOS, Android, Web, iPad, and more.</li>
          </ul>
        </div>
      </section>

      {/* Built for Privacy */}
      <section className="py-16 px-4 bg-black">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">Built for Privacy & Control</h2>
        <p className="text-center mb-8">Burner Point is designed for people who want control over their communication.</p>
        <p className="text-center mb-8">Use it for:</p>
        <ul className="max-w-2xl mx-auto text-lg space-y-2">
          <li>🔒 Online registrations</li>
          <li>🔒 Marketplaces</li>
          <li>🔒 Business interactions</li>
          <li>🔒 Dating platforms</li>
          <li>🔒 Travel communication</li>
          <li>🔒 Everyday privacy protection</li>
        </ul>
        <p className="text-center text-xl mt-12 text-[#00FF9D]">Stay Connected. Stay Anonymous.</p>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-[#013220]">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">Frequently Asked Questions</h2>
        <p className="text-center">Everything you need to know about Burner Point, how it works, and how to get started.</p>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-black">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#00FF9D]">Services Section</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#013220] p-8 rounded border border-[#00FF9D]">
            <h3 className="text-2xl font-bold mb-4 text-[#00FF9D]">Instant Verifications</h3>
            <ul className="space-y-2">
              <li>Get a non-VoIP number</li>
              <li>Register on any platform</li>
              <li>Receive SMS & OTP instantly</li>
              <li>Respond to voice verification calls</li>
              <li>Choose any country or area code</li>
            </ul>
          </div>
          <div className="bg-[#013220] p-8 rounded border border-[#00FF9D]">
            <h3 className="text-2xl font-bold mb-4 text-[#00FF9D]">Flexible Rentals</h3>
            <ul className="space-y-2">
              <li>Short-term (1–14 days)</li>
              <li>Long-term (renewable monthly)</li>
              <li>Unlimited verification usage</li>
              <li>Multi-platform compatibility</li>
            </ul>
          </div>
          <div className="bg-[#013220] p-8 rounded border border-[#00FF9D]">
            <h3 className="text-2xl font-bold mb-4 text-[#00FF9D]">API Access</h3>
            <p>Integrate Burner Point into your system and automate verifications at scale.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-black text-center">
        <h2 className="text-4xl font-bold mb-4 text-[#00FF9D]">BURNER POINT</h2>
        <p className="mb-4">Your one-stop platform for secure SMS, text, and voice verification.</p>
        <p className="mb-8">Built for speed, privacy, and global access.<br />Exceptional service and competitive pricing set us apart.</p>
        <p className="mb-8 text-[#00FF9D]">Private by Design.<br />Stay Connected. Stay Anonymous.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-left">
          <div>
            <h3 className="font-bold mb-4 text-[#00FF9D]">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#39FF14] transition">Product</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Overview</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Verifications</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Rentals</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">API</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-[#00FF9D]">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#39FF14] transition">About</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Blog</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Updates</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Careers</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-[#00FF9D]">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#39FF14] transition">FAQ</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Help Center</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-[#00FF9D]">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#39FF14] transition">Terms</a></li>
              <li><a href="#" className="hover:text-[#39FF14] transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <p className="mt-12 text-[#00FF9D]">© 2026 Burner Point. All rights reserved.</p>
      </footer>
    </main>
  );
}