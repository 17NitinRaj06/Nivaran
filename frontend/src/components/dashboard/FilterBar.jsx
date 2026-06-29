import { useState, useEffect } from 'react';
import { HiFilter } from 'react-icons/hi';

const categories = [
  'all',
  'pothole',
  'streetlight',
  'garbage',
  'drainage',
  'water',
  'road',
  'electricity',
  'other',
];

const sortOptions = [
  { label: 'Recent', value: 'recent' },
  { label: 'Old', value: 'old' },
  { label: 'Most Upvoted', value: 'upvotes' },
  { label: 'Least Upvoted', value: 'upvotes_asc' },
];

const statusOptions = ['all', 'pending', 'in-progress', 'resolved'];

export default function FilterBar({ reports, onFilter }) {
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [city, setCity] = useState('all');
  const [sort, setSort] = useState('recent');
  const [isOpen, setIsOpen] = useState(false);

  const cities = [...new Set(reports.map((r) => r.city).filter(Boolean))].sort();

  useEffect(() => {
    let filtered = [...reports];

    if (category !== 'all') {
      filtered = filtered.filter((r) => r.category === category);
    }
    if (status !== 'all') {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (city !== 'all') {
      filtered = filtered.filter((r) => r.city === city);
    }

    const withEmergency = (a, b) => {
      const aE = a.emergency ? 1 : 0;
      const bE = b.emergency ? 1 : 0;
      if (aE !== bE) return bE - aE;
      return 0;
    };

    switch (sort) {
      case 'recent':
        filtered.sort((a, b) => withEmergency(a, b) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
      case 'old':
        filtered.sort((a, b) => withEmergency(a, b) || (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        break;
      case 'upvotes':
        filtered.sort((a, b) => withEmergency(a, b) || (b.upvotes || 0) - (a.upvotes || 0));
        break;
      case 'upvotes_asc':
        filtered.sort((a, b) => withEmergency(a, b) || (a.upvotes || 0) - (b.upvotes || 0));
        break;
    }

    onFilter(filtered);
  }, [category, status, sort, reports, onFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-forest-700 font-medium lg:hidden"
      >
        <HiFilter size={18} />
        Filters & Sort
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:flex lg:items-center gap-4 mt-3 lg:mt-0 flex-wrap`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-earth-500 font-medium whitespace-nowrap">Category:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field py-2 text-sm flex-1"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-earth-500 font-medium whitespace-nowrap">Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-field py-2 text-sm flex-1"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-earth-500 font-medium whitespace-nowrap">Location:</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-field py-2 text-sm flex-1"
          >
            <option value="all">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-earth-500 font-medium whitespace-nowrap">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field py-2 text-sm flex-1"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
