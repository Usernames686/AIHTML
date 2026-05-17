import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='min-h-screen bg-[#F7F8FA]'>
            {children}
        </div>
    )
}

export default layout
