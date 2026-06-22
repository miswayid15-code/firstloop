import { Toaster } from 'react-hot-toast'

export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={14}
            containerStyle={{
                top: 20,
                right: 20
            }}
            toastOptions={{
                duration: 3500,
                style: {
                    background: 'rgba(255,255,255,0.78)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '22px',
                    padding: '16px 18px',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '330px',
                    boxShadow: '0 12px 40px rgba(255, 74, 124, 0.18)',
                    letterSpacing: '0.2px'
                },
                success: {
                    iconTheme: {
                        primary: '#22bb33',
                        secondary: '#ffffff'
                    },
                    style: {
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,240,246,0.96))',
                        border: '1px solid rgba(255, 74, 124, 0.18)'
                    }
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff'
                    },
                    style: {
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,235,235,0.96))',
                        border: '1px solid rgba(239,68,68,0.18)'
                    }
                },
                loading: {
                    iconTheme: {
                        primary: '#7c3aed',
                        secondary: '#ffffff'
                    },
                    style: {
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(245,240,255,0.96))',
                        border: '1px solid rgba(124,58,237,0.18)'
                    }
                }
            }}
        />
    )
}
