import React, { useState, useEffect } from 'react';
const URL = '';


function Header() {
  const [setName, name] = useState('');
  async function meReq() {
    try {
      const res = await fetch(URL, {
        'method': 'GET',
        'credentials': 'true'
      });

      if(!res) {
        return;
      }

      const data = res.data;
      setName(data.name);

    } catch(error) {
      console.log(error);
    }
  }
  return (
    <header>
      <section>
        <div className='Logo'>
          <h1>MB2I</h1>
        </div>
          <div className='Links'>
            <ul>
              <li className="links">Home</li>
              <li className="links">Plant</li>
              <li className="links">Config</li>
              <li className="links">${name}</li>
            </ul>
          </div>
      </section>
    </header>
  );
}

export default Header;