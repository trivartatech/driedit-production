import React from 'react';

const AdminBanners = () => {
  return (
    <div>
      <h1 className="text-4xl font-black mb-8">HERO BANNERS MANAGEMENT</h1>
      <div className="bg-white/5 p-6 border border-white/10">
        <p className="text-gray-400">Banner management - Upload images, set button text, redirect URLs, reorder, enable/disable.</p>
        <p className="text-sm text-gray-500 mt-2">API Ready: adminAPI.getBanners(), createBanner(), updateBanner()</p>
      </div>
    </div>
  );
};

export default AdminBanners;