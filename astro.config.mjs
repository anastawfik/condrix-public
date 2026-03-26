// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://condrix.dev',
	integrations: [
		starlight({
			title: 'Condrix',
			description: 'Distributed AI Agent Orchestration Platform',
			favicon: '/favicon.png',
			logo: {
				src: './src/assets/logo.png',
				replacesTitle: true,
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/anastawfik/condrix' },
			],
			editLink: {
				baseUrl: 'https://github.com/anastawfik/condrix-public/edit/main/',
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Authentication', slug: 'getting-started/authentication' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Overview', slug: 'architecture/overview' },
						{ label: 'Connection Modes', slug: 'architecture/connection-modes' },
						{ label: 'Security', slug: 'architecture/security' },
					],
				},
				{
					label: 'Deployment',
					items: [
						{ label: 'Docker', slug: 'deployment/docker' },
						{ label: 'Cloudflare Tunnel', slug: 'deployment/cloudflare-tunnel' },
						{ label: 'Environment Variables', slug: 'deployment/environment-variables' },
					],
				},
				{
					label: 'Development',
					items: [
						{ label: 'Commands', slug: 'development/commands' },
						{ label: 'Monorepo Structure', slug: 'development/monorepo-structure' },
						{ label: 'Roadmap', slug: 'development/roadmap' },
					],
				},
			],
		}),
	],
});
