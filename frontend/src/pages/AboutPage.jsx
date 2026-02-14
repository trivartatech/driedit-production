import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Shield, Shirt, Check } from 'lucide-react';

const AboutPage = () => {
  const values = [
    { icon: Sparkles, text: "Comfort should be premium" },
    { icon: Shield, text: "Quality should be affordable" },
    { icon: Shirt, text: "Style should be for everyone" },
    { icon: Heart, text: "Clothing should speak your emotion" }
  ];

  const expertise = [
    "Fabric quality",
    "Comfort & fitting",
    "Market trends",
    "Modern streetwear culture",
    "Premium materials at affordable prices"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E10600]/10 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1 
            className="text-4xl md:text-6xl font-black mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            OUR <span className="text-[#E10600]">STORY</span>
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-gray-300 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Our story began with a simple passion in 2018 — the dream to create a clothing brand that speaks emotion, comfort, and identity for everyone who wears it.
          </motion.p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="bg-white/5 border border-white/10 p-8 md:p-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-black mb-6">
              MORE THAN <span className="text-[#E10600]">FABRIC</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              From day one, we believed clothing is more than fabric...
            </p>
            <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
              It is self-expression, confidence, and a way to tell the world who you are without saying a word.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-16 md:py-24 bg-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-black mb-8 text-center">
              YEARS OF <span className="text-[#E10600]">LEARNING</span>
            </h2>
            <p className="text-gray-300 text-lg text-center mb-10">
              With this vision, we spent years studying:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expertise.map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center space-x-3 bg-black/50 p-4 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-2 h-2 bg-[#E10600]" />
                  <span className="text-white font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Purpose Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8">
              Every design we create carries a purpose — to make you feel <span className="text-white font-bold">confident</span>, <span className="text-white font-bold">stylish</span>, and <span className="text-white font-bold">truly yourself</span>.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              Today, after years of learning, experimenting, and perfecting our craft, we are proud to bring our brand online, delivering a <span className="text-[#E10600] font-bold">premium</span>, <span className="text-[#E10600] font-bold">fancy</span>, and <span className="text-[#E10600] font-bold">attractive</span> clothing experience right to your doorstep.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-[#E10600]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-black mb-10 text-center text-white">
              WE BELIEVE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center space-x-4 bg-black/20 p-5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Check size={24} className="text-white flex-shrink-0" />
                  <span className="text-white font-bold text-lg">{value.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Closing Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8">
              This is not just a brand —<br />
              It's a <span className="text-[#E10600] font-bold">journey</span>, a <span className="text-[#E10600] font-bold">passion</span>, and a <span className="text-[#E10600] font-bold">promise</span> to bring you the best of style and comfort, always.
            </p>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-black text-white">
                Welcome to our world.
              </p>
              <p className="text-2xl md:text-3xl font-black">
                Welcome to <span className="text-[#E10600]">DRIEDIT</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
