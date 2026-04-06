import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = "Yuvr's - Professional Invoicing"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #4f46e5, #c026d3, #0891b2)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '60px 80px',
            borderRadius: '40px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h1
            style={{
              fontSize: '100px',
              fontWeight: '900',
              margin: '0',
              background: 'linear-gradient(to right, #4f46e5, #c026d3)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.05em',
            }}
          >
            Yuvr's
          </h1>
          <p
            style={{
              fontSize: '32px',
              color: '#475569',
              margin: '20px 0 0 0',
              fontWeight: '500',
            }}
          >
            Professional Invoicing Made Simple
          </p>
          <div
            style={{
              marginTop: '40px',
              display: 'flex',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', color: '#6366f1', fontSize: '24px', fontWeight: 'bold' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Smart Templates
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#d946ef', fontSize: '24px', fontWeight: 'bold' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Global Tracking
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#06b6d4', fontSize: '24px', fontWeight: 'bold' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Instant PDF
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
