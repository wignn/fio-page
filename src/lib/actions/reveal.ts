export function reveal(
	node: HTMLElement,
	options = { delay: 0, duration: 700, threshold: 0.1, y: 30 }
) {
	node.style.opacity = '0';
	node.style.transform = `translateY(${options.y}px)`;
	node.style.transition = `opacity ${options.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${options.delay}ms, transform ${options.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${options.delay}ms`;

	const observer = new IntersectionObserver(
		(entries) => {
			if (entries[0].isIntersecting) {
				node.style.opacity = '1';
				node.style.transform = 'translateY(0)';
				observer.unobserve(node);
			}
		},
		{ threshold: options.threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
