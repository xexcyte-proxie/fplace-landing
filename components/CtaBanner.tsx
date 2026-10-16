import Image from "next/image";

export default function CtaBanner() {
  return (
    <section className="cta-section" aria-labelledby="cta-title">
      <div className="cta-banner">
        <Image
          className="cta-background"
          src="/img/Frame 270.png"
          alt=""
          fill
          sizes="(max-width: 767px) calc(100vw - 32px), 1282px"
          aria-hidden="true"
        />
        <div className="cta-content">
          <h2 className="cta-title reveal-item" data-reveal-item id="cta-title">
            Ready to explore your next experience?
          </h2>
          <p className="cta-description reveal-item" data-reveal-item>
            Open fplaces at any supported venue and
            <br />
            find your way in seconds.
          </p>
          <a
            className="secondary-button cta-button reveal-item"
            data-reveal-item
            href="#get-started"
          >
            Get started
          </a>
        </div>
      </div>
    </section>
  );
}
