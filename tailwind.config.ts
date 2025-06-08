import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(210, 40%, 90%)', // Light blue border
				input: 'hsl(210, 40%, 98%)', // Very light blue input
				ring: 'hsl(210, 80%, 60%)', // Brighter blue for focus rings
				background: 'hsl(0, 0%, 100%)', // White background
				foreground: 'hsl(210, 29%, 24%)', // Dark blue-gray for text
				primary: {
					DEFAULT: 'hsl(210, 80%, 50%)', // Vibrant blue
					foreground: 'hsl(0, 0%, 100%)' // White text on primary
				},
				secondary: {
					DEFAULT: 'hsl(210, 40%, 96%)', // Very light blue
					foreground: 'hsl(210, 29%, 24%)' // Dark blue-gray text
				},
				destructive: {
					DEFAULT: 'hsl(0, 84%, 60%)', // Red for destructive actions
					foreground: 'hsl(0, 0%, 100%)' // White text
				},
				muted: {
					DEFAULT: 'hsl(210, 20%, 98%)', // Off-white with blue tint
					foreground: 'hsl(210, 10%, 46%)' // Muted blue-gray text
				},
				accent: {
					DEFAULT: 'hsl(210, 90%, 55%)', // Slightly brighter blue
					foreground: 'hsl(0, 0%, 100%)' // White text
				},
				popover: {
					DEFAULT: 'hsl(0, 0%, 100%)', // White background
					foreground: 'hsl(210, 29%, 24%)' // Dark blue-gray text
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
