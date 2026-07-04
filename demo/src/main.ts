import { createCfg } from 'cfg';
import 'cfg/styles.css';
import './demo.css';

const cfg = createCfg({ scheduler: 'external' });
const pane = cfg.pane({ title: 'Controls' });

pane.button({ label: 'Ready', action: () => undefined });

function loop(time: number) {
	cfg.beginFrame(time);
	cfg.endFrame(time);
	cfg.renderFrame(time);
	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
