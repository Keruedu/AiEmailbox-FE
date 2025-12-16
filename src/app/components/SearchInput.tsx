import React, { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';

interface SearchInputProps {
  onSearch: (query: string) => void;
  defaultValue?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, defaultValue = '' }) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="header-search" style={{ flex: 1, maxWidth: '600px', minWidth: '200px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <SearchOutlined style={{ position: 'absolute', left: '12px', color: '#999', fontSize: '16px' }} />
        <input 
          type="text" 
          placeholder="Search emails..." 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch(value);
          }}
          style={{
            width: '100%',
            height: '40px',
            padding: '4px 12px 4px 40px',
            borderRadius: '20px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            outline: 'none',
            fontSize: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.3s'
          }}
          onFocus={(e) => {
             e.target.style.borderColor = '#1890ff';
             e.target.style.boxShadow = '0 0 0 2px rgba(24,144,255,0.2)';
          }}
          onBlur={(e) => {
             e.target.style.borderColor = '#e0e0e0';
             e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          }}
        />
      </div>
    </div>
  );
};

export default SearchInput;
