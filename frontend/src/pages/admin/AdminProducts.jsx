import React from 'react';

const AdminProducts = () => {
  return (
    <div>
      <h1 className="text-4xl font-black mb-8">PRODUCTS MANAGEMENT</h1>
      <div className="bg-white/5 p-6 border border-white/10">
        <p className="text-gray-400">Product CRUD interface - Add/Edit/Delete products with images, prices, sizes, stock management.</p>
        <p className="text-sm text-gray-500 mt-2">API Ready: productsAPI.create(), update(), delete()</p>
      </div>
    </div>
  );
};

export default AdminProducts;