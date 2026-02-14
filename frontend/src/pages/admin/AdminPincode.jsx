import React from 'react';

const AdminPincode = () => {
  return (
    <div>
      <h1 className="text-4xl font-black mb-8">PINCODE & GST MANAGEMENT</h1>
      <div className="bg-white/5 p-6 border border-white/10">
        <p className="text-gray-400">Pincode management - Add/remove pincodes, set shipping charges, COD availability. Update GST percentage.</p>
        <p className="text-sm text-gray-500 mt-2">API Ready: adminAPI.getPincodes(), createPincode(), updateGST()</p>
      </div>
    </div>
  );
};

export default AdminPincode;