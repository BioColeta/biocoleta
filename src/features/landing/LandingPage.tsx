import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CloudRain,
  Cpu,
  Map,
  RadioTower,
  ScanSearch,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Brand } from '@/app/Brand'
import { ThemeToggle } from '@/app/ThemeToggle'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const steps = [
  {
    icon: RadioTower,
    title: 'O dispositivo envia',
    text: 'Sensores simulados informam o nível da água e o fluxo de cada bueiro.',
  },
  {
    icon: ScanSearch,
    title: 'O sistema identifica',
    text: 'Uma regra fixa reconhece nível alto com água parada em duas leituras seguidas.',
  },
  {
    icon: UserCheck,
    title: 'Uma pessoa decide',
    text: 'O operador analisa as evidências, confirma e programa a limpeza.',
  },
]

const features = [
  {
    icon: Map,
    title: 'Mapa operacional',
    text: 'Cinquenta bueiros com status ao vivo.',
    preview: <StatusBadge tone="danger" label="Obstruído" />,
  },
  {
    icon: Sparkles,
    title: 'Análise assistida (simulada)',
    text: 'Probabilidade e justificativa, sem ação automática.',
    preview: <StatusBadge tone="warning" label="Provável obstrução · 92%" />,
  },
  {
    icon: CloudRain,
    title: 'Planejamento de chuva',
    text: 'Veja no relevo onde a rede ficaria pressionada.',
    preview: <StatusBadge tone="warning" label="Pressão 148%" />,
  },
  {
    icon: Cpu,
    title: 'Saúde dos dispositivos',
    text: 'Bateria, sinal, violação e sensores sem comunicação.',
    preview: <StatusBadge tone="ok" label="Online" />,
  },
]

const goals = [
  {
    number: 6,
    title: 'Água potável e saneamento',
    text: 'Evitar contaminação e transbordamentos.',
  },
  {
    number: 11,
    title: 'Cidades sustentáveis',
    text: 'Infraestrutura urbana mais resiliente.',
  },
  {
    number: 12,
    title: 'Consumo responsável',
    text: 'Melhor uso de recursos e deslocamentos.',
  },
  { number: 13, title: 'Ação climática', text: 'Reduzir os impactos de chuvas intensas.' },
]

const team = ['Hadrian', 'César', 'Jerônimo', 'Miguel', 'Rafael', 'Victor']

function Section({ title, children }: { title: string; children: ReactNode }) {
  const still = useReducedMotion()
  return (
    <motion.section
      className="mx-auto w-full max-w-6xl px-4 py-14"
      initial={still ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
    >
      <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {children}
    </motion.section>
  )
}

function Calls() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg">
        <Link to="/login">
          Abrir o painel <ArrowRight />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link to="/simulator">Testar o simulador</Link>
      </Button>
    </div>
  )
}

export function LandingPage() {
  const still = useReducedMotion()
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </header>
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:py-20">
          <motion.div
            initial={still ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-primary mb-3 text-sm font-medium">
              Drenagem urbana · monitoramento preventivo
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Veja o risco antes que a água vire problema.
            </h1>
            <p className="text-muted-foreground my-6 max-w-xl text-lg">
              O BioColeta acompanha bueiros, sinaliza obstruções e ajuda a equipe a decidir onde
              agir primeiro.
            </p>
            <Calls />
          </motion.div>
          <div className="relative mx-auto grid aspect-square w-56 place-items-center md:w-80">
            {(still ? [] : [0, 1, 2]).map((ring) => (
              <motion.span
                key={ring}
                className="border-primary absolute inset-0 rounded-full border"
                animate={{ scale: [0.35, 1], opacity: [0.8, 0] }}
                transition={{ duration: 3, delay: ring, repeat: Infinity }}
                aria-hidden
              />
            ))}
            <img src={`${import.meta.env.BASE_URL}logo-mark.svg`} alt="" className="size-24" />
          </div>
        </section>

        <Section title="O problema">
          <p className="text-muted-foreground max-w-3xl text-lg">
            Falhas na drenagem costumam ser percebidas só quando a rua já alagou, com transtornos,
            danos ao patrimônio e riscos à saúde. Sem monitoramento contínuo, as equipes não
            conseguem agir antes.
          </p>
        </Section>

        <Section title="Como funciona">
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title}>
                <Card className="h-full">
                  <Icon className="text-primary mb-3 size-7" aria-hidden />
                  <h3 className="font-semibold">
                    {index + 1}. {title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">{text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="O que você encontra no painel">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text, preview }) => (
              <Card key={title} className="flex flex-col gap-3">
                <Icon className="text-primary size-6" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{text}</p>
                <div className="bg-background mt-auto rounded-lg border p-3">{preview}</div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Objetivos de Desenvolvimento Sustentável">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map((goal) => (
              <Card key={goal.number}>
                <p className="text-primary text-3xl font-semibold">ODS {goal.number}</p>
                <h3 className="mt-2 font-semibold">{goal.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{goal.text}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Equipe">
          <ul className="flex flex-wrap gap-3">
            {team.map((name) => (
              <li key={name} className="bg-card rounded-full border px-4 py-2 text-sm">
                {name}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Teste agora">
          <p className="text-muted-foreground mb-5">
            Provoque uma obstrução no simulador e acompanhe o alerta nascer no painel.
          </p>
          <Calls />
        </Section>
      </main>
      <footer className="text-muted-foreground border-t p-6 text-center text-sm">
        Projeto acadêmico. Dados, sensores, autenticação e análise de IA são simulados.
      </footer>
    </div>
  )
}
