/* ==========================================================================
   DARAC ESTATE — interaction layer
   No dependencies. One deferred IIFE. Every module fails soft.
   ========================================================================== */
(function () {
	"use strict";

	var d = document,
		w = window;
	var RM = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function $(s, c) { return (c || d).querySelector(s); }
	function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
	function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o); }

	/* ── focus trap ───────────────────────────────────────────────────────── */
	var SEL = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
	function trap(box) {
		function key(e) {
			if (e.key !== "Tab") return;
			var f = $$(SEL, box).filter(function (el) { return el.offsetParent !== null; });
			if (!f.length) return;
			var a = f[0], z = f[f.length - 1];
			if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); }
			else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
		}
		box.addEventListener("keydown", key);
		return function () { box.removeEventListener("keydown", key); };
	}
	var lockCount = 0;
	function lock(on) {
		lockCount = Math.max(0, lockCount + (on ? 1 : -1));
		d.documentElement.style.overflow = lockCount ? "hidden" : "";
	}

	/* ── 1. split headlines into masked words ─────────────────────────────── */
	function split() {
		$$("[data-split]").forEach(function (el) {
			if (el.dataset.splitDone) return;
			el.dataset.splitDone = "1";
			var walk = d.createTreeWalker(el, NodeFilter.SHOW_TEXT, null),
				nodes = [], n, i = 0;
			while ((n = walk.nextNode())) if (n.nodeValue.trim()) nodes.push(n);
			nodes.forEach(function (node) {
				var frag = d.createDocumentFragment();
				node.nodeValue.split(/(\s+)/).forEach(function (p) {
					if (!p) return;
					if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(" ")); return; }
					var box = d.createElement("span"); box.className = "ln";
					var inner = d.createElement("i"); inner.className = "ln-i";
					inner.textContent = p;
					inner.style.setProperty("--ld", (i * 0.042).toFixed(3) + "s");
					i++;
					box.appendChild(inner); frag.appendChild(box);
				});
				node.parentNode.replaceChild(frag, node);
			});
		});
	}

	/* ── 2. scroll reveals ────────────────────────────────────────────────── */
	function mark(el) {
		el.classList.add("is-in");
		if (el.hasAttribute("data-split")) el.classList.add("is-split");
	}
	function reveal() {
		$$("[data-stagger]").forEach(function (p) {
			var step = parseFloat(p.getAttribute("data-stagger")) || 0.08;
			$$("[data-reveal],[data-clip]", p).forEach(function (c, i) {
				c.style.setProperty("--d", (i * step).toFixed(3) + "s");
			});
		});
		/* [data-clip] targets carry clip-path: inset(0 0 100% 0). That zeroes their
		   intersection rect, so IntersectionObserver can never reach the threshold for
		   them. They are swept with getBoundingClientRect, which ignores self-clipping. */
		/* Cards parked off-screen inside a horizontal rail never intersect the viewport,
		   so they are swept on vertical position too, or they stay invisible until the
		   rail has been scrolled back and forth. */
		/* Every revealable element is also swept by rect, not just the clipped and
		   railed ones: if the viewport jumps (anchor link, restored scroll, fast
		   flick) the observer can miss an element entirely and it would stay at
		   opacity 0 forever. Anything at or above the trigger line is marked. */
		var clips = [].slice.call($$("[data-clip],[data-rail] [data-reveal],[data-reveal],[data-split],.eyebrow"));
		/* The hero copy sits on the bottom edge of a 100svh stage, so its button
		   used to fall below the sweep line and only faded in once the next
		   section had been scrolled into view. The first screen is marked now. */
		$$(".hero [data-reveal],.hero [data-split],.hero .eyebrow,.phero [data-reveal],.phero [data-split]").forEach(mark);
		function sweep() {
			for (var i = clips.length - 1; i >= 0; i--) {
				var r = clips[i].getBoundingClientRect();
				if (r.top < w.innerHeight * 0.999) { mark(clips[i]); clips.splice(i, 1); }
			}
			if (!clips.length) {
				w.removeEventListener("scroll", sweep);
				w.removeEventListener("resize", sweep);
			}
		}
		var els = [].slice.call($$("[data-reveal],[data-split],.eyebrow"));
		if (RM || !("IntersectionObserver" in w)) { els.concat(clips).forEach(mark); return; }
		var io = new IntersectionObserver(function (list) {
			list.forEach(function (e) {
				if (!e.isIntersecting) return;
				mark(e.target);
				io.unobserve(e.target);
			});
		}, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
		els.forEach(function (el) { io.observe(el); });
		w.addEventListener("scroll", sweep, { passive: true });
		w.addEventListener("resize", sweep);
		sweep();
	}

	/* ── 3. intro curtain (once per session, home only) ───────────────────── */
	function intro(next) {
		var want = d.body.hasAttribute("data-intro");
		var seen = false;
		try { seen = !!sessionStorage.getItem("darac.intro"); } catch (e) {}
		if (!want || RM || seen) return next();
		try { sessionStorage.setItem("darac.intro", "1"); } catch (e) {}
		var c = d.createElement("div");
		c.className = "curtain";
		c.setAttribute("aria-hidden", "true");
		c.innerHTML = '<img src="assets/img/logo-white.png" alt="">';
		d.body.appendChild(c);
		lock(true);
		setTimeout(function () {
			c.classList.add("is-out");
			lock(false);
			next();
			setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 1200);
		}, 1200);
	}

	/* ── 4. page-transition wipe ──────────────────────────────────────────── */
	function wipe() {
		var el = $(".wipe");
		if (!el || RM) return;
		on(d, "click", function (e) {
			var a = e.target.closest && e.target.closest("a");
			/* Never hijack a click another handler already claimed (drawer, lightbox,
			   close buttons). Without this the drawer opens and the page still leaves. */
			if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			if (a.hasAttribute("data-enquire") || a.hasAttribute("data-lb") || a.hasAttribute("data-close")) return;
			var href = a.getAttribute("href") || "";
			if (!/\.html$/.test(href) || a.target === "_blank") return;
			if (a.href === w.location.href) return;
			e.preventDefault();
			el.classList.add("is-on");
			setTimeout(function () { w.location.href = a.href; }, 480);
		});
	}

	/* ── 5. scroll: progress bar, header, parallax ────────────────────────── */
	function scroller() {
		var fill = $(".bar span"),
			hdr = $(".hdr"),
			px = $$("[data-parallax]"),
			last = w.scrollY,
			queued = false;

		function frame() {
			queued = false;
			var y = w.scrollY;
			var h = d.documentElement.scrollHeight - w.innerHeight;
			if (fill) fill.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
			if (hdr) {
				hdr.classList.toggle("is-stuck", y > 10);
				/* the bar is pinned: it never slides away on scroll-down */
				hdr.classList.remove("is-hidden");
			}
			if (!RM) {
				px.forEach(function (el) {
					var r = el.getBoundingClientRect();
					if (r.bottom < -400 || r.top > w.innerHeight + 400) return;
					var k = parseFloat(el.getAttribute("data-parallax")) || 0.08;
					var mid = r.top + r.height / 2 - w.innerHeight / 2;
					var off = -mid * k;
					/* optional cap so a faster factor can never expose the edge of the art */
					var cap = parseFloat(el.getAttribute("data-parallax-max"));
					if (cap) off = Math.max(-cap, Math.min(cap, off));
					el.style.transform = "translate3d(0," + off.toFixed(2) + "px,0)";
				});
			}
			last = y;
		}
		function tick() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
		on(w, "scroll", tick, { passive: true });
		on(w, "resize", tick);
		frame();
	}

	/* ── 6. mobile navigation ─────────────────────────────────────────────── */
	function menu() {
		var b = $(".burger"), nav = $("#mnav");
		if (!b || !nav) return;
		var release = null;
		function set(open) {
			b.classList.toggle("is-open", open);
			b.setAttribute("aria-expanded", open ? "true" : "false");
			b.setAttribute("aria-label", open ? "Close menu" : "Open menu");
			nav.classList.toggle("is-open", open);
			nav.setAttribute("aria-hidden", open ? "false" : "true");
			lock(open);
			if (open) {
				release = trap(nav);
				var first = $("a", nav);
				if (first) setTimeout(function () { first.focus(); }, 300);
			} else if (release) { release(); release = null; b.focus(); }
		}
		on(b, "click", function () { set(!nav.classList.contains("is-open")); });
		$$("a", nav).forEach(function (a) { on(a, "click", function () { set(false); }); });
		on(d, "keydown", function (e) {
			if (e.key === "Escape" && nav.classList.contains("is-open")) set(false);
		});
	}

	/* ── 7. enquiry drawer ────────────────────────────────────────────────── */
	function drawer() {
		var box = $("#enquire"), scrim = $("#scrim");
		if (!box) return;
		var release = null, opener = null;
		function set(open) {
			box.classList.toggle("is-open", open);
			box.setAttribute("aria-hidden", open ? "false" : "true");
			if (scrim) scrim.classList.toggle("is-on", open);
			lock(open);
			if (open) {
				release = trap(box);
				var f = $("input,select,textarea", box);
				if (f) setTimeout(function () { f.focus(); }, 420);
			} else {
				if (release) { release(); release = null; }
				if (opener) { opener.focus(); opener = null; }
			}
		}
		$$("[data-enquire]").forEach(function (t) {
			on(t, "click", function (e) { e.preventDefault(); opener = t; set(true); });
		});
		$$("[data-close]", box).forEach(function (t) { on(t, "click", function () { set(false); }); });
		on(scrim, "click", function () { set(false); });
		on(d, "keydown", function (e) {
			if (e.key === "Escape" && box.classList.contains("is-open")) set(false);
		});
	}

	/* ── 8. lightbox ──────────────────────────────────────────────────────── */
	function lightbox() {
		var box = $("#lbox");
		if (!box) return;
		var shots = [].slice.call($$("[data-lb]"));
		if (!shots.length) return;
		var img = $("img", box), cap = $("figcaption", box);
		var prev = $(".lbox__p", box), next = $(".lbox__n", box);
		var release = null, opener = null, at = 0;

		/* Prev/next stay inside the block the picture came from, so a gallery never
		   walks into the floor plans or into another section's photography.
		   Override the grouping with data-lb-group="name" on any ancestor. */
		var sections = [].slice.call(d.querySelectorAll("section"));
		function keyOf(t) {
			var g = t.closest ? t.closest("[data-lb-group]") : null;
			if (g) return "g:" + g.getAttribute("data-lb-group");
			var s = t.closest ? t.closest("section") : null;
			return s ? "s:" + sections.indexOf(s) : "loose";
		}
		var groups = {};
		shots.forEach(function (t) {
			var k = keyOf(t);
			(groups[k] = groups[k] || []).push(t);
		});
		var group = shots;

		function show(i) {
			at = (i + group.length) % group.length;
			var t = group[at];
			img.src = t.getAttribute("data-lb");
			img.alt = t.getAttribute("data-lb-cap") || "";
			cap.textContent = t.getAttribute("data-lb-cap") || "";
			var many = group.length > 1;
			if (prev) prev.hidden = !many;
			if (next) next.hidden = !many;
		}
		function set(open) {
			box.classList.toggle("is-open", open);
			box.setAttribute("aria-hidden", open ? "false" : "true");
			lock(open);
			if (open) { release = trap(box); $(".lbox__x", box).focus(); }
			else {
				if (release) { release(); release = null; }
				if (opener) { opener.focus(); opener = null; }
			}
		}
		shots.forEach(function (t) {
			on(t, "click", function (e) {
				e.preventDefault();
				opener = t;
				group = groups[keyOf(t)] || shots;
				show(group.indexOf(t));
				set(true);
			});
		});
		on($(".lbox__x", box), "click", function () { set(false); });
		on(prev, "click", function () { show(at - 1); });
		on(next, "click", function () { show(at + 1); });
		on(box, "click", function (e) { if (e.target === box) set(false); });
		on(d, "keydown", function (e) {
			if (!box.classList.contains("is-open")) return;
			if (e.key === "Escape") set(false);
			if (e.key === "ArrowLeft") show(at - 1);
			if (e.key === "ArrowRight") show(at + 1);
		});
	}

	/* ── 9. count-up numbers ──────────────────────────────────────────────── */
	function counters() {
		$$("[data-count]").forEach(function (el) {
			var goal = parseFloat(el.getAttribute("data-count")) || 0, ran = false;
			function run() {
				if (ran) return;
				ran = true;
				if (RM) { el.textContent = goal; return; }
				var t0 = 0;
				function step(t) {
					if (!t0) t0 = t;
					var p = Math.min(1, (t - t0) / 1500);
					el.textContent = Math.round(goal * (1 - Math.pow(1 - p, 3)));
					if (p < 1) requestAnimationFrame(step);
				}
				requestAnimationFrame(step);
			}
			if (!("IntersectionObserver" in w)) return run();
			var io = new IntersectionObserver(function (l) {
				l.forEach(function (e) { if (e.isIntersecting) { run(); io.disconnect(); } });
			}, { threshold: 0.6 });
			io.observe(el);
		});
	}

	/* ── 10. testimonial slider ───────────────────────────────────────────── */
	function slider() {
		$$("[data-slider]").forEach(function (root) {
			var track = $(".tst__track", root),
				items = $$(".tst__item", root),
				dots = $(".dots", root),
				prev = $("[data-prev]", root),
				next = $("[data-next]", root);
			if (!track || items.length < 2) return;
			var at = 0, timer = null;
			if (dots) {
				items.forEach(function (_, i) {
					var b = d.createElement("button");
					b.type = "button";
					b.setAttribute("aria-label", "Show testimonial " + (i + 1));
					on(b, "click", function () { go(i, true); });
					dots.appendChild(b);
				});
			}
			function go(i, stop) {
				at = (i + items.length) % items.length;
				track.style.transform = "translate3d(" + -at * 100 + "%,0,0)";
				items.forEach(function (it, k) { it.setAttribute("aria-hidden", k === at ? "false" : "true"); });
				if (dots) $$("button", dots).forEach(function (b, k) { b.classList.toggle("is-on", k === at); });
				if (stop) halt();
			}
			function halt() { if (timer) { clearInterval(timer); timer = null; } }
			on(prev, "click", function () { go(at - 1, true); });
			on(next, "click", function () { go(at + 1, true); });
			on(root, "keydown", function (e) {
				if (e.key === "ArrowLeft") go(at - 1, true);
				if (e.key === "ArrowRight") go(at + 1, true);
			});
			var x0 = null;
			on(root, "touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
			on(root, "touchend", function (e) {
				if (x0 === null) return;
				var dx = e.changedTouches[0].clientX - x0;
				if (Math.abs(dx) > 45) go(at + (dx < 0 ? 1 : -1), true);
				x0 = null;
			}, { passive: true });
			on(root, "mouseenter", halt);
			go(0);
			if (!RM) timer = setInterval(function () { go(at + 1); }, 7000);
		});
	}

	/* ── 11. horizontal rail ──────────────────────────────────────────────── */
	function rails() {
		$$("[data-rail]").forEach(function (root) {
			var lane = $(".rail", root) || root.querySelector("[data-rail-lane]");
			if (!lane) return;
			var prev = $("[data-rail-prev]", root), next = $("[data-rail-next]", root);
			function step() {
				var first = lane.firstElementChild;
				return first ? first.getBoundingClientRect().width + 24 : lane.clientWidth * 0.8;
			}
			function sync() {
				var max = lane.scrollWidth - lane.clientWidth - 2;
				if (prev) prev.disabled = lane.scrollLeft <= 2;
				if (next) next.disabled = lane.scrollLeft >= max;
			}
			on(prev, "click", function () { lane.scrollBy({ left: -step(), behavior: RM ? "auto" : "smooth" }); });
			on(next, "click", function () { lane.scrollBy({ left: step(), behavior: RM ? "auto" : "smooth" }); });
			on(lane, "scroll", sync, { passive: true });
			on(w, "resize", sync);
			sync();
		});
	}

	/* ── 12. forms ────────────────────────────────────────────────────────── */
	function forms() {
		var MAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
		$$("[data-form]").forEach(function (form) {
			var ok = form.parentNode && form.parentNode.querySelector(".ok");

			function check(el) {
				var wrap = el.closest(".field");
				if (!wrap) return true;
				var msg = wrap.querySelector(".err");
				var v = (el.value || "").trim();
				var bad = "";
				if (el.required && !v) bad = "This field is required.";
				else if (el.type === "email" && v && !MAIL.test(v)) bad = "Enter a valid email address.";
				else if (el.type === "tel" && v && v.replace(/\D/g, "").length < 10) bad = "Enter a valid phone number.";
				wrap.classList.toggle("is-bad", !!bad);
				el.setAttribute("aria-invalid", bad ? "true" : "false");
				if (msg) msg.textContent = bad;
				return !bad;
			}

			$$("input,select,textarea", form).forEach(function (el) {
				on(el, "blur", function () { check(el); });
				on(el, "input", function () {
					var wrap = el.closest(".field");
					if (wrap && wrap.classList.contains("is-bad")) check(el);
				});
			});

			on(form, "submit", function (e) {
				e.preventDefault();
				var fields = $$("input,select,textarea", form);
				var bad = fields.filter(function (el) { return !check(el); });
				if (bad.length) { bad[0].focus(); return; }
				var btn = $('button[type="submit"]', form);
				var label = btn && btn.querySelector("span");
				var text = label ? label.textContent : "";
				if (btn) btn.disabled = true;
				if (label) label.textContent = "Sending\u2026";
				setTimeout(function () {
					if (btn) { btn.disabled = false; }
					if (label) label.textContent = text;
					form.reset();
					form.style.display = "none";
					if (ok) {
						ok.classList.add("is-on");
						ok.setAttribute("tabindex", "-1");
						ok.focus();
					}
				}, 900);
			});
		});
	}

	/* ── 13. year stamp ───────────────────────────────────────────────────── */
	function year() {
		var y = new Date().getFullYear();
		$$("[data-year]").forEach(function (el) { el.textContent = y; });
	}

	/* ── footer links: label slides up, red copy slides in behind it ───── */
	function footSwap() {
		$$(".foot a").forEach(function (a) {
			if (a.querySelector(".swap") || a.querySelector("svg") || a.querySelector("img")) return;
			var inner = a.innerHTML.trim();
			if (!inner) return;
			a.innerHTML =
				'<span class="swap"><span class="swap__a">' + inner +
				'</span><span class="swap__b" aria-hidden="true">' + inner + "</span></span>";
		});
	}

	/* ── boot ─────────────────────────────────────────────────────────────── */
	/* ── every picture in <main> wipes down on entry ────────────────── */
	function autoClip() {
		var skip = ".hero__media,.phero__media,.trust__media,.pstack,[data-parallax],.lbox,.hdr,.foot,.mnav";
		[].slice.call(d.querySelectorAll("main img")).forEach(function (im) {
			if (!im.closest) return;
			if (im.closest("[data-clip]")) return;
			if (im.closest(skip)) return;
			var p = im.parentElement;
			/* a wrapper that holds nothing but this picture can be clipped directly,
			   which also buys the slow 1.14 → 1 push-in. Anything else is clipped on
			   the <img> itself so no layout is disturbed. */
			if (p && p.children.length === 1 && !p.matches("main,section,body,.shell")) p.setAttribute("data-clip", "");
			else im.setAttribute("data-clip", "");
		});
	}

	/* ── floor plans: hovering a row re-wipes the drawing beside it ─────── */
	function floorSwap() {
		var media = $(".floor__media");
		if (!media) return;
		var img = $("img", media);
		var rows = $$(".frow");
		if (!img || !rows.length) return;
		var busy = false;
		function swapTo(r) {
			var src = r.getAttribute("data-plan") || r.getAttribute("data-lb");
			if (!src || busy) return;
			busy = true;
			rows.forEach(function (o) { o.classList.toggle("is-active", o === r); });
			if (RM) { img.src = src; busy = false; return; }
			/* drop .is-in, force a reflow, then put it back: the clip-path wipe
			   replays on every hover even when the drawing is the same file */
			media.classList.remove("is-in");
			void media.offsetWidth;
			img.src = src;
			img.alt = r.getAttribute("data-lb-cap") || img.alt;
			requestAnimationFrame(function () {
				media.classList.add("is-in");
				setTimeout(function () { busy = false; }, 240);
			});
		}
		rows.forEach(function (r) {
			on(r, "mouseenter", function () { swapTo(r); });
			on(r, "focus", function () { swapTo(r); });
		});
	}

	/* ── project stacks: the block pins, three pictures wipe up ────── */
	function pstack() {
		var stacks = $$("[data-pstack]");
		if (!stacks.length) return;
		stacks.forEach(function (st) {
			var pin = $(".pstack__pin", st);
			var items = $$(".pstack__item", st);
			var dots = $$(".pstack__dots i", st);
			if (!pin || items.length < 2) return;
			/* later pictures sit on top, so the incoming wipe covers the last one */
			items.forEach(function (it, k) { it.style.zIndex = String(k + 1); });
			var queued = false, shown = -1, primed = false;
			function apply(i) {
				items.forEach(function (it, k) { it.classList.toggle("is-shown", k <= i); });
				dots.forEach(function (dt, k) { dt.classList.toggle("is-on", k === i); });
			}

			function frame() {
				queued = false;
				var top = parseFloat(w.getComputedStyle(pin).top) || 0;
				var travel = st.offsetHeight - pin.offsetHeight;
				var r = st.getBoundingClientRect();
				var p = travel > 0 ? (top - r.top) / travel : 0;
				if (p < 0) p = 0;
				if (p > 0.99999) p = 0.99999;
				var n = items.length;
				var i = Math.floor(p * n);
				if (i > n - 1) i = n - 1;
				if (i !== shown) {
					shown = i;
					/* first paint after a reload: let the clipped state render once, then
					   add the class so the wipe plays even when the page is restored
					   half way down the stack */
					if (!primed) {
						primed = true;
						requestAnimationFrame(function () {
							requestAnimationFrame(function () { apply(shown); });
						});
					} else apply(i);
				}
				/* the pictures hold still: the next one wipes down over the last */
			}
			function tick() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
			on(w, "scroll", tick, { passive: true });
			on(w, "resize", tick);
			frame();
		});
	}

	/* -- home hero: three slides, auto advanced -------------------------- */
	function hero() {
		var box = $("[data-hero]");
		if (!box) return;
		var slides = $$(".hero__slide", box);
		var dots = $$(".hero__dots button", box);
		if (slides.length < 2) return;
		var at = 0, timer = null, WAIT = 4600;
		function show(i) {
			i = (i + slides.length) % slides.length;
			if (i === at) return;
			at = i;
			slides.forEach(function (s, k) {
				s.classList.toggle("is-on", k === i);
				s.setAttribute("aria-hidden", k === i ? "false" : "true");
			});
			dots.forEach(function (dt, k) {
				dt.classList.toggle("is-on", k === i);
				dt.setAttribute("aria-selected", k === i ? "true" : "false");
			});
		}
		function stop() { if (timer) { clearInterval(timer); timer = null; } }
		function play() { stop(); if (RM) return; timer = setInterval(function () { show(at + 1); }, WAIT); }
		dots.forEach(function (dt, k) { on(dt, "click", function () { show(k); play(); }); });
		on(box, "mouseenter", stop);
		on(box, "mouseleave", play);
		on(box, "focusin", stop);
		on(box, "focusout", play);
		on(d, "visibilitychange", function () { if (d.hidden) stop(); else play(); });
		play();
	}

	/* -- walkthrough: the YouTube frame is only built when it is asked for */
	function vidPlay() {
		var box = $(".vid[data-yt]");
		if (!box) return;
		var id = box.getAttribute("data-yt");
		function open() {
			if (box.classList.contains("is-playing")) return;
			/* a page opened from disk has no origin YouTube will accept, so the
			   embed answers with a player configuration error. Served over
			   http(s) it plays inline; from a file it opens in a new tab. */
			var p = w.location.protocol;
			if (p !== "http:" && p !== "https:") {
				w.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener");
				return;
			}
			var f = d.createElement("iframe");
			f.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
			f.title = box.getAttribute("data-title") || "Project walkthrough";
			f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
			f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
			f.setAttribute("allowfullscreen", "");
			box.appendChild(f);
			box.classList.add("is-playing");
		}
		on(box, "click", function (e) { e.preventDefault(); open(); });
	}

	function boot() {
		year();
		footSwap();
		autoClip();
		split();
		scroller();
		menu();
		drawer();
		lightbox();
		floorSwap();
		pstack();
		hero();
		vidPlay();
		counters();
		slider();
		rails();
		forms();
		wipe();
		intro(function () { reveal(); });
	}

	if (d.readyState === "loading") on(d, "DOMContentLoaded", boot);
	else boot();
})();
