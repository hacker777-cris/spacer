import React from "react";
import {
  Camera,
  Facebook,
  Home,
  Instagram,
  LogIn,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

export default function AboutUs() {
  const teamMembers = [
    {
      name: "Jane Doe",
      role: "CEO & Founder",
      image: "/src/assets/team/person1.webp",
    },
    {
      name: "John Smith",
      role: "CTO",
      image: "/src/assets/team/person2.webp",
    },
    {
      name: "Emily Brown",
      role: "Head of Design",
      image: "/src/assets/team/person3.webp",
    },
    {
      name: "Michael Johnson",
      role: "Lead Developer",
      image: "/src/assets/team/person4.webp",
    },
  ];

  return (
    <div className="bg-gray-100 text-gray-800 font-medium min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gray-800 text-white">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About Spacer
            </h1>
            <p className="text-xl mb-8">
              Revolutionizing the way people find and book spaces
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg mb-8">
              At Spacer, we're on a mission to transform the way people
              discover, book, and utilize spaces. We believe that the perfect
              space can inspire creativity, foster collaboration, and create
              unforgettable experiences. Our platform connects space seekers
              with unique venues, making it easier than ever to find the ideal
              location for any occasion.
            </p>
          </div>
        </section>

        {/* Our Team */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Meet Our Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-gray-100 rounded-lg overflow-hidden shadow-md"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-1">
                      {member.name}
                    </h3>
                    <p className="text-gray-600">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <p className="text-lg mb-6">
              Spacer was born out of a simple idea: to make finding and booking
              unique spaces as easy as booking a hotel room. Our founders,
              seasoned entrepreneurs and space enthusiasts, recognized the
              challenges faced by both space owners and those seeking temporary
              spaces for various needs.
            </p>
            <p className="text-lg mb-6">
              Since our launch in 2020, we've grown from a small startup to a
              thriving platform connecting thousands of space owners with eager
              space seekers. Our journey has been marked by continuous
              innovation, user-centric design, and a commitment to creating
              value for our community.
            </p>
            <p className="text-lg">
              Today, Spacer is more than just a booking platform – it's a
              vibrant marketplace where creativity meets opportunity, and where
              every space tells a unique story. We're excited about the future
              and the endless possibilities that lie ahead in reimagining how we
              use and share spaces.
            </p>
          </div>
        </section>

        {/* Contact Us */}
        <section className="py-16 px-4 bg-gray-800 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
              <div className="flex items-center">
                <Mail className="mr-2" size={20} />
                <span>info@spacer.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2" size={20} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2" size={20} />
                <span>123 Main St, Anytown, USA</span>
              </div>
            </div>
            <div className="flex justify-center space-x-6">
              <a
                href="#"
                className="text-white hover:text-blue-400 transition-colors duration-200 flex items-center"
              >
                <Facebook size={24} className="mr-2" />
                <span>Follow us on Facebook</span>
              </a>
              <a
                href="#"
                className="text-white hover:text-pink-400 transition-colors duration-200 flex items-center"
              >
                <Instagram size={24} className="mr-2" />
                <span>Follow us on Instagram</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-4 text-white">Spacer</h3>
            <p className="text-gray-400">
              Connecting people with perfect spaces
            </p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-white hover:text-gray-300">
              <Camera size={24} />
            </a>
            <a href="#" className="text-white hover:text-gray-300">
              <Home size={24} />
            </a>
            <a href="#" className="text-white hover:text-gray-300">
              <LogIn size={24} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
