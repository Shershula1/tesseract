import { ConstructionStage } from "@/components/construction-stage";
import { ProjectionStage } from "@/components/projection-stage";
import { RotationStage } from "@/components/rotation-stage";

export default function Home() {
  return (
    <>
      <div className="vignette" aria-hidden="true" />
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <header className="mx-auto max-w-2xl">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#e6b15a]">Тессеракт</p>
          <h1 className="mt-4 font-display text-[clamp(3rem,8vw,5.4rem)] font-medium leading-[0.92] tracking-[-0.03em] text-balance text-[#f7f1e6]">
            Четырёхмерный куб
          </h1>
          <p className="mt-6 text-[0.95rem] tracking-[0.04em] text-[#cbbba6]">
            16 вершин · 32 ребра · 24 квадрата · 8 кубов
          </p>
          <div className="prose-copy mt-8">
            <p>
              Четырёхмерный куб — тессеракт — собран по тому же правилу, что и обычный куб, только
              направлений у него четыре. От отрезка один шаг в сторону даёт квадрат, от квадрата —
              куб, от куба — тессеракт. В каждой вершине встречаются четыре равных ребра, и любые два
              из них перпендикулярны.
            </p>
            <p>
              Нарисовать это буквально нельзя: экран плоский, а четвёртому направлению некуда лечь
              под прямым углом к остальным трём. Ниже не сам тессеракт, а его проекция. Маленький
              куб внутри разрастается, проходит сквозь стенки и оказывается снаружи. Рёбра при этом
              не меняют длины. Странно выглядит только изображение.
            </p>
          </div>
        </header>

        <RotationStage />

        <section className="mx-auto mt-24 max-w-2xl" aria-labelledby="build-title">
          <h2
            id="build-title"
            className="font-display text-[clamp(2.1rem,5vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-[#f7f1e6]"
          >
            Как создаётся четырёхмерный куб
          </h2>
          <div className="prose-copy mt-6">
            <p>
              Сначала фигура не вращается. Её собирают так же, как квадрат из отрезка и куб из
              квадрата: копируют, сдвигают копию в новом направлении и соединяют соответственные
              вершины. На чертеже сдвиг четвёртого направления приходится рисовать наискосок — в
              нашу сторону ему лечь уже некуда. Копия того же размера, а новые рёбра параллельны.
              Это параллельная проекция.
            </p>
          </div>
        </section>

        <ConstructionStage />

        <section className="mx-auto mt-24 max-w-2xl" aria-labelledby="why-title">
          <h2
            id="why-title"
            className="font-display text-[clamp(2.1rem,5vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-[#f7f1e6]"
          >
            Почему мы видим его так странно
          </h2>
          <div className="prose-copy mt-6">
            <p>
              Сборка на чертеже и вращение в начале страницы — разные картины одного тела. Во
              вращении внутренний куб меняет размер и проходит сквозь внешний. Так получается
              центральная проекция: размер на рисунке зависит от того, насколько вершина близка к
              точке, из которой выпущены лучи.
            </p>
            <p>
              На обычном кубе это видно сразу. Из одной точки во все стороны расходятся лучи, и тень
              проволочного каркаса на плоскости служит проекцией. Если грань не параллельна этой
              плоскости, её квадрат ложится трапецией. С квадратом ничего не случилось — так падает
              тень.
            </p>
          </div>
        </section>

        <ProjectionStage />

        <section className="mx-auto mt-10 max-w-2xl">
          <div className="prose-copy">
            <p>
              Четырёхмерный куб проецируют тем же способом, только лучи идут в четырёхмерном
              пространстве и встречают уже не плоскость, а трёхмерное полотно. Ближняя кубическая
              ячейка видна большим кубом, дальняя — меньшим кубом внутри. Остальные ячейки такие же
              кубы, но на изображении некоторые из них становятся усечёнными четырёхугольными
              пирамидами: два квадратных основания разного размера и рёбра между ними.
            </p>
            <p>
              Поворот в плоскости, где есть четвёртая ось, не мнёт фигуру. Он меняет лишь то, какая
              ячейка ближе к точке наблюдения. Дальняя выходит вперёд, ближняя уходит назад — и
              картинка словно выворачивается. В самом тессеракте ни одно ребро не стало короче и ни
              один угол не перестал быть прямым.
            </p>
            <p>
              Держать его в голове удобнее всего именно как такую тень. Два вложенных куба — не
              большой предмет и маленький предмет. Это две равные ячейки: одна ближе к точке, из
              которой выпущены лучи, другая дальше.
            </p>
          </div>
        </section>

        <footer className="mx-auto mt-20 max-w-2xl border-t border-white/10 pt-6 text-sm leading-relaxed text-[#9a8b7a]">
          Ход объяснения повторяет ролик{" "}
          <a
            className="text-[#e6b15a] underline decoration-[#e6b15a]/40 underline-offset-4 hover:decoration-[#e6b15a]"
            href="https://www.youtube.com/watch?v=gIooDsZQBo8"
            target="_blank"
            rel="noreferrer"
          >
            «Как представить себе четырёхмерный куб?»
          </a>
          .
        </footer>
      </main>
    </>
  );
}
