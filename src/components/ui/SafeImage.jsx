import React, { useState, useEffect } from 'react';

const SafeImage = ({ src, alt, className, onClick, loading = 'lazy' }) => {
    const [error, setError] = useState(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setError(false); }, [src]);
    
    if (error || !src) {
        return (
            <div onClick={onClick} className={`${className} bg-stone-800 flex flex-col items-center justify-center border-2 border-stone-600 text-center p-2 overflow-hidden shadow-inner`}>
                <span className="text-2xl">📦</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{alt}</span>
            </div>
        );
    }
    
    return <img src={src} alt={alt} loading={loading} className={className} onError={() => setError(true)} onClick={onClick} />;
};

export default React.memo(SafeImage);
