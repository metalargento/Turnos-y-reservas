--
-- PostgreSQL database dump
--

\restrict mVU3UyLKw7msTrdgPpjZkYx4QWXkbMI6txI4tYiaw52ZdFJyn3LrVGpwn3DMKjl

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid,
    day_of_week integer,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.availability OWNER TO postgres;

--
-- Name: TABLE availability; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.availability IS 'Disponibilidad semanal regular de cada profesional';


--
-- Name: COLUMN availability.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.availability.day_of_week IS '0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado';


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    branch_id uuid,
    professional_id uuid,
    service_id uuid,
    client_name text NOT NULL,
    client_email text NOT NULL,
    client_phone text,
    client_notes text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    status text DEFAULT 'confirmed'::text,
    cancelled_by text,
    cancellation_reason text,
    payment_required boolean DEFAULT false,
    payment_status text DEFAULT 'pending'::text,
    payment_amount numeric(10,2),
    payment_id text,
    confirmation_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bookings_cancelled_by_check CHECK ((cancelled_by = ANY (ARRAY['client'::text, 'professional'::text, 'admin'::text]))),
    CONSTRAINT bookings_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text]))),
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'rescheduled'::text, 'completed'::text])))
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: TABLE bookings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.bookings IS 'Reservas de turnos de clientes finales';


--
-- Name: COLUMN bookings.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bookings.status IS 'confirmed: activo, cancelled: cancelado, rescheduled: reprogramado, completed: finalizado';


--
-- Name: COLUMN bookings.payment_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bookings.payment_id IS 'ID de pago de Mercado Pago (si aplica)';


--
-- Name: COLUMN bookings.confirmation_token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bookings.confirmation_token IS 'Token único para que el cliente pueda cancelar/reprogramar sin cuenta';


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name text NOT NULL,
    address text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: TABLE branches; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.branches IS 'Sucursales de un negocio';


--
-- Name: COLUMN branches.business_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.branches.business_id IS 'Negocio al que pertenece la sucursal';


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    rubro text,
    description text,
    logo_url text,
    primary_color text DEFAULT '#000000'::text,
    secondary_color text DEFAULT '#FFFFFF'::text,
    plan_status text DEFAULT 'expired'::text,
    plan_expires_at timestamp with time zone,
    onboarding_completed boolean DEFAULT false,
    email_provider text DEFAULT 'resend'::text,
    smtp_host text,
    smtp_port integer,
    smtp_user text,
    smtp_password_encrypted text,
    google_calendar_enabled boolean DEFAULT false,
    google_calendar_token_encrypted text,
    min_advance_hours integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT businesses_email_provider_check CHECK ((email_provider = ANY (ARRAY['resend'::text, 'smtp'::text]))),
    CONSTRAINT businesses_plan_status_check CHECK ((plan_status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text])))
);


ALTER TABLE public.businesses OWNER TO postgres;

--
-- Name: TABLE businesses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.businesses IS 'Negocios suscriptos al sistema de reservas';


--
-- Name: COLUMN businesses.slug; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.businesses.slug IS 'Identificador único para URL pública (ej: peluqueria-juan)';


--
-- Name: COLUMN businesses.plan_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.businesses.plan_status IS 'active: pago al día, expired/cancelled: sin servicio';


--
-- Name: COLUMN businesses.min_advance_hours; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.businesses.min_advance_hours IS 'Horas mínimas de anticipación para reservar';


--
-- Name: professional_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.professional_services (
    professional_id uuid NOT NULL,
    service_id uuid NOT NULL
);


ALTER TABLE public.professional_services OWNER TO postgres;

--
-- Name: TABLE professional_services; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.professional_services IS 'Relación muchos-a-muchos: servicios que puede realizar cada profesional';


--
-- Name: professionals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.professionals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    business_id uuid,
    branch_id uuid,
    display_name text NOT NULL,
    avatar_url text,
    bio text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.professionals OWNER TO postgres;

--
-- Name: TABLE professionals; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.professionals IS 'Profesionales (empleados) vinculados a un negocio';


--
-- Name: COLUMN professionals.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.professionals.user_id IS 'Usuario del sistema asociado (puede ser null si no tiene login)';


--
-- Name: COLUMN professionals.branch_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.professionals.branch_id IS 'Sucursal donde trabaja el profesional';


--
-- Name: schedule_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid,
    blocked_from timestamp with time zone NOT NULL,
    blocked_until timestamp with time zone NOT NULL,
    reason text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.schedule_blocks OWNER TO postgres;

--
-- Name: TABLE schedule_blocks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.schedule_blocks IS 'Bloqueos manuales de agenda (vacaciones, feriados, ausencias)';


--
-- Name: COLUMN schedule_blocks.reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_blocks.reason IS 'Motivo del bloqueo (visible solo para admin)';


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    name text NOT NULL,
    executed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_migrations_id_seq OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name text NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    price numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: TABLE services; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.services IS 'Servicios que ofrece un negocio';


--
-- Name: COLUMN services.duration_minutes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.services.duration_minutes IS 'Duración del servicio en minutos';


--
-- Name: COLUMN services.price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.services.price IS 'Precio del servicio (null si no tiene cobro online)';


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL,
    full_name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'professional'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Usuarios del sistema (owners y profesionales)';


--
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.role IS 'owner: dueño del negocio, professional: empleado';


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Data for Name: availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability (id, professional_id, day_of_week, start_time, end_time, is_active, created_at) FROM stdin;
0a297aa5-4675-4afe-8475-28c62612e4e5	64bc11cd-a619-4f53-9a36-3be134677f33	2	09:00:00	18:00:00	t	2026-05-14 15:56:29.035593+00
44bb24b1-6578-4e12-9c6f-eeea88090d69	64bc11cd-a619-4f53-9a36-3be134677f33	3	09:00:00	18:00:00	t	2026-05-14 15:56:31.102585+00
386df87b-70bb-4655-b50f-099ae4ff3242	64bc11cd-a619-4f53-9a36-3be134677f33	1	09:00:00	16:00:00	t	2026-05-14 16:23:55.830984+00
89b81e89-9947-44b0-ae58-0ea19cc78db3	64bc11cd-a619-4f53-9a36-3be134677f33	1	09:00:00	18:00:00	f	2026-05-14 15:56:27.155643+00
a0e2c5d5-c54a-4706-b380-677079e54eff	64bc11cd-a619-4f53-9a36-3be134677f33	4	09:00:00	16:00:00	t	2026-05-14 16:25:28.727686+00
f6e40665-9884-40ce-894a-8d12a13f16ce	64bc11cd-a619-4f53-9a36-3be134677f33	5	09:00:00	16:00:00	t	2026-05-14 16:25:36.657499+00
b90863cb-fcde-4f18-b1da-c43aad584573	d5e3b4e7-2160-45cc-8133-a7614b080ca9	2	09:00:00	17:00:00	t	2026-05-19 21:27:07.142043+00
3fdc04e0-10b2-4bb9-9576-a9e3ded97674	d5e3b4e7-2160-45cc-8133-a7614b080ca9	3	09:00:00	17:00:00	t	2026-05-19 21:27:23.663534+00
43d22df5-377a-4aac-bb6b-c399b39cdad3	d5e3b4e7-2160-45cc-8133-a7614b080ca9	4	09:00:00	17:00:00	t	2026-05-19 21:27:36.828598+00
1f9aa7f4-2074-4b1e-99f5-e9709c1e367d	d5e3b4e7-2160-45cc-8133-a7614b080ca9	5	09:00:00	17:00:00	t	2026-05-19 21:27:42.857002+00
250349e0-f832-41ad-a209-6405fd93230f	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	17:00:00	f	2026-05-19 21:27:02.178416+00
89d78825-dd48-4d09-b979-108b362f2f0b	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	17:00:00	f	2026-05-19 22:12:01.795436+00
f814ae20-256d-41c0-ba53-df04e4a7d181	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	18:00:00	f	2026-05-19 22:14:05.245032+00
f29ac9dc-5a79-412e-b956-548cc9e7d815	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	17:15:00	18:00:00	f	2026-05-19 22:15:49.514525+00
3070fcd0-e6fd-447c-9e0a-18b4f9a22d72	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	17:00:00	f	2026-05-19 22:15:23.265209+00
01fa6452-5357-4b10-9798-e54de9e84f4b	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	18:00:00	f	2026-05-20 14:46:21.578165+00
622755ea-3bc5-4842-85f1-5788769c519d	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	18:00:00	f	2026-05-20 14:50:22.127673+00
1ed72c84-ba57-4120-9d8b-8e1dd25cbe55	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	18:00:00	f	2026-05-20 14:53:49.937059+00
b7bc9f8e-7066-4db3-9a21-cf899186de9e	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	16:00:00	f	2026-05-20 14:53:59.487089+00
571f3eb3-4731-4e3d-8269-4b32faae0f10	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	09:00:00	13:00:00	t	2026-05-21 15:00:07.189188+00
5f90b010-a448-40a1-9fe7-79fd06adc138	d5e3b4e7-2160-45cc-8133-a7614b080ca9	1	14:00:00	18:00:00	t	2026-05-21 15:00:18.920523+00
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, business_id, branch_id, professional_id, service_id, client_name, client_email, client_phone, client_notes, starts_at, ends_at, status, cancelled_by, cancellation_reason, payment_required, payment_status, payment_amount, payment_id, confirmation_token, created_at, updated_at) FROM stdin;
c4f85d14-d878-40f8-9545-90dfdcdef264	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	7bb51256-9702-474f-9412-eae853d48130	jorge gutierrez	jorge@mail.com	\N	\N	2026-05-19 10:30:00+00	2026-05-19 14:30:00+00	confirmed	\N	\N	f	pending	\N	\N	gMY1vbzXOFLiik5Tags6ZjxszisPyMzOU4L_UzTV4zQ	2026-05-14 16:23:37.679614+00	2026-05-14 16:23:37.679614+00
9fc43748-4b82-42da-ac88-82d60776413e	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	7bb51256-9702-474f-9412-eae853d48130	nicolas avellaneda	nico@las.com	\N	\N	2026-05-15 10:30:00+00	2026-05-15 14:30:00+00	confirmed	\N	\N	f	pending	\N	\N	UGNijnd576UWQt3L0NFWfMLMBsSITWNJXMuXzB5hmrw	2026-05-14 19:37:42.861919+00	2026-05-14 19:37:42.861919+00
5e068fed-8eca-4471-b555-60b928202558	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	e208b8e7-26d2-4619-b5f8-52e0be6a0bae	pablo perez	pablo@mail.com	\N	\N	2026-05-21 11:30:00+00	2026-05-21 15:00:00+00	confirmed	\N	\N	f	pending	\N	\N	n4V-0Obu3nJMRbQU-N65giEUBHt-IpTihfppHBExikE	2026-05-19 17:01:59.073656+00	2026-05-19 17:01:59.073656+00
cef0aeab-9b7e-4746-801b-e80cea710522	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	4770c62a-9282-45ff-8beb-f521605e6c68	Juan García	juan.garcía@example.com	\N	\N	2026-05-19 14:00:00+00	2026-05-19 14:30:00+00	confirmed	\N	\N	f	pending	\N	\N	\N	2026-05-19 18:52:15.481035+00	2026-05-19 18:52:15.481035+00
de8a16a3-cb11-4b9b-a5dd-e3806ea0fc8a	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	7bb51256-9702-474f-9412-eae853d48130	María López	maría.lópez@example.com	\N	\N	2026-05-19 15:30:00+00	2026-05-19 16:30:00+00	confirmed	\N	\N	f	pending	\N	\N	\N	2026-05-19 18:52:15.481035+00	2026-05-19 18:52:15.481035+00
4fd5a479-0449-409c-9c89-37aad7de22a4	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	4770c62a-9282-45ff-8beb-f521605e6c68	Pedro Ruiz	pedro.ruiz@example.com	\N	\N	2026-05-20 10:00:00+00	2026-05-20 10:30:00+00	confirmed	\N	\N	f	pending	\N	\N	\N	2026-05-19 18:52:15.481035+00	2026-05-19 18:52:15.481035+00
12ab1780-b9c1-4046-a2c1-4de83dfaec3f	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	4770c62a-9282-45ff-8beb-f521605e6c68	Carlos Torres	carlos.torres@example.com	\N	\N	2026-05-26 11:00:00+00	2026-05-26 11:30:00+00	confirmed	\N	\N	f	pending	\N	\N	\N	2026-05-19 18:52:15.481035+00	2026-05-19 18:52:15.481035+00
d1ec4d80-73d3-4b6f-b03b-fcb5782c4a45	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	7bb51256-9702-474f-9412-eae853d48130	Sandra Díaz	sandra.díaz@example.com	\N	\N	2026-06-02 13:00:00+00	2026-06-02 14:00:00+00	confirmed	\N	\N	f	pending	\N	\N	\N	2026-05-19 18:52:15.481035+00	2026-05-19 18:52:15.481035+00
a5fe5ee4-2af7-4ba7-8ae0-f907435d5178	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	4770c62a-9282-45ff-8beb-f521605e6c68	Roberto González	roberto.gonzález@example.com	\N	\N	2026-05-24 14:00:00+00	2026-05-24 14:30:00+00	cancelled	\N	\N	f	pending	\N	\N	\N	2026-05-19 18:52:15.481035+00	2026-05-19 18:52:15.481035+00
20795298-2b6c-4905-9514-8c616bde5407	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	e208b8e7-26d2-4619-b5f8-52e0be6a0bae	martin	martin@mail.com	\N	\N	2026-05-20 14:30:00+00	2026-05-20 18:00:00+00	confirmed	\N	\N	f	pending	\N	\N	DiQp0CoVFmbItShZApPa83-Addk6JjrzOBt71ZFor20	2026-05-20 14:37:10.226182+00	2026-05-20 14:37:10.226182+00
9cae15c5-0a2b-4552-a3e4-841ff672335c	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	7bb51256-9702-474f-9412-eae853d48130	Ana Martínez	ana.martínez@example.com	\N	\N	2026-05-22 16:00:00+00	2026-05-22 17:00:00+00	cancelled	admin	Cancelado por administrador	f	pending	\N	\N	\N	2026-05-19 18:52:15.481035+00	2026-05-20 16:02:53.622839+00
80c284cb-76d7-4845-bd4e-f1a42dd1d845	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	7bb51256-9702-474f-9412-eae853d48130	jorge	jorge@mail.com	3515986599	me duele la muela	2026-05-21 16:00:00+00	2026-05-21 17:00:00+00	confirmed	\N	\N	f	pending	\N	\N	Fy6Bgh3gfe4Xw0EZhk1dRO7AwWnrpkj6VUQ1869_2Gw	2026-05-21 14:24:30.876762+00	2026-05-21 14:24:30.876762+00
b620640e-33e1-4468-a4e0-fee40319ca92	fb73e166-d564-414c-881b-90598d136b7b	\N	64bc11cd-a619-4f53-9a36-3be134677f33	e208b8e7-26d2-4619-b5f8-52e0be6a0bae	franco	franco@mail.com	3515986598	\N	2026-05-21 18:00:00+00	2026-05-21 18:30:00+00	cancelled	admin	Cancelado por administrador	f	pending	\N	\N	ld0zX4XNn8PortsFwKLwScD7xoXCBkCLWZVLigVXR9A	2026-05-21 14:34:31.422961+00	2026-05-21 14:35:11.599442+00
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, business_id, name, address, phone, is_active, created_at, updated_at) FROM stdin;
76f3d80b-81fd-4ed2-be4c-1c1a42cc1977	fb73e166-d564-414c-881b-90598d136b7b	sucursal 1	aconcagua 2334	3516666666	t	2026-05-14 15:52:32.473654+00	2026-05-14 15:52:32.473654+00
7b66e982-8f88-4837-b26a-46725ebdb538	fb73e166-d564-414c-881b-90598d136b7b	Sucursal Principal	Av. Principal 123, Trelew	+54 280 1234567	t	2026-05-19 18:51:31.095954+00	2026-05-19 18:51:31.095954+00
\.


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.businesses (id, owner_id, name, slug, rubro, description, logo_url, primary_color, secondary_color, plan_status, plan_expires_at, onboarding_completed, email_provider, smtp_host, smtp_port, smtp_user, smtp_password_encrypted, google_calendar_enabled, google_calendar_token_encrypted, min_advance_hours, created_at, updated_at) FROM stdin;
8153a67a-29df-47a8-b17a-c413fcf18caf	2c707788-f466-4779-b930-237cd3ee8498	Consultorios Pepe Garabato	consultorios-pepe-garabato	Odontologia	Lo conoces a conocelo, agachate y marcelo...	\N	#000000	#FFFFFF	expired	\N	f	resend	\N	\N	\N	\N	f	\N	1	2026-05-19 19:30:31.684911+00	2026-05-19 19:30:31.684911+00
fb73e166-d564-414c-881b-90598d136b7b	1bdf5b05-9c26-4013-8580-c96092a6d38f	Consultorio Chapatin	consultorio-chapatin	medicina integral	si no te arreglamos, te devolvemos el dinero	https://via.placeholder.com/200	#1e40af	#f3f4f6	active	\N	t	resend	\N	\N	\N	\N	f	\N	2	2026-05-14 14:47:05.368998+00	2026-05-21 14:22:12.580721+00
\.


--
-- Data for Name: professional_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.professional_services (professional_id, service_id) FROM stdin;
64bc11cd-a619-4f53-9a36-3be134677f33	e208b8e7-26d2-4619-b5f8-52e0be6a0bae
64bc11cd-a619-4f53-9a36-3be134677f33	7bb51256-9702-474f-9412-eae853d48130
d5e3b4e7-2160-45cc-8133-a7614b080ca9	9ba7acc5-f6b0-40bb-a68b-2846b4a619a7
d5e3b4e7-2160-45cc-8133-a7614b080ca9	4770c62a-9282-45ff-8beb-f521605e6c68
d5e3b4e7-2160-45cc-8133-a7614b080ca9	e208b8e7-26d2-4619-b5f8-52e0be6a0bae
d5e3b4e7-2160-45cc-8133-a7614b080ca9	7bb51256-9702-474f-9412-eae853d48130
\.


--
-- Data for Name: professionals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.professionals (id, user_id, business_id, branch_id, display_name, avatar_url, bio, is_active, created_at, updated_at) FROM stdin;
64bc11cd-a619-4f53-9a36-3be134677f33	\N	fb73e166-d564-414c-881b-90598d136b7b	76f3d80b-81fd-4ed2-be4c-1c1a42cc1977	norberto georgalos	https://www.shutterstock.com/image-photo/smiling-doctor-stethoscope-clipboard-on-600w-2536277671.jpg	Viejo y Peludo	t	2026-05-14 15:56:17.8219+00	2026-05-14 15:56:17.8219+00
d5e3b4e7-2160-45cc-8133-a7614b080ca9	\N	fb73e166-d564-414c-881b-90598d136b7b	76f3d80b-81fd-4ed2-be4c-1c1a42cc1977	Dr. Pepe Molinari	\N	rengo pero baila bien	t	2026-05-19 19:49:40.047858+00	2026-05-19 19:49:40.047858+00
\.


--
-- Data for Name: schedule_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedule_blocks (id, professional_id, blocked_from, blocked_until, reason, created_by, created_at) FROM stdin;
9bb06310-f688-40bc-a4ff-d20f24307978	64bc11cd-a619-4f53-9a36-3be134677f33	2026-05-25 00:00:00+00	2026-05-25 23:59:00+00		1bdf5b05-9c26-4013-8580-c96092a6d38f	2026-05-19 21:53:15.776416+00
7d750500-87e1-4092-a888-d1d12d8c89cc	d5e3b4e7-2160-45cc-8133-a7614b080ca9	2026-05-25 00:00:00+00	2026-05-25 23:59:00+00	feriado	1bdf5b05-9c26-4013-8580-c96092a6d38f	2026-05-19 21:53:36.710125+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (id, name, executed_at) FROM stdin;
1	001_create_users.sql	2026-05-14 14:20:01.239776
2	002_create_businesses.sql	2026-05-14 14:20:01.252349
3	003_create_branches.sql	2026-05-14 14:20:01.261373
4	004_create_professionals.sql	2026-05-14 14:20:01.27384
5	005_create_services.sql	2026-05-14 14:20:01.287269
6	006_create_schedules.sql	2026-05-14 14:20:01.30457
7	007_create_bookings.sql	2026-05-14 14:20:01.372019
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, business_id, name, description, duration_minutes, price, is_active, created_at, updated_at) FROM stdin;
e208b8e7-26d2-4619-b5f8-52e0be6a0bae	fb73e166-d564-414c-881b-90598d136b7b	Limpieza dental	disminuye el sarro y aclara el color de los dientes	30	15000.00	t	2026-05-14 15:51:31.823802+00	2026-05-14 15:51:31.823802+00
7bb51256-9702-474f-9412-eae853d48130	fb73e166-d564-414c-881b-90598d136b7b	tratamiento de conducto	te duele una banda	60	60000.00	t	2026-05-14 15:52:23.43964+00	2026-05-14 15:52:23.43964+00
4770c62a-9282-45ff-8beb-f521605e6c68	fb73e166-d564-414c-881b-90598d136b7b	Corte de Cabello	Corte profesional	30	500.00	t	2026-05-19 18:51:31.095954+00	2026-05-19 18:51:31.095954+00
9ba7acc5-f6b0-40bb-a68b-2846b4a619a7	fb73e166-d564-414c-881b-90598d136b7b	Afeitado	Afeitado con navaja	20	300.00	t	2026-05-19 18:51:31.095954+00	2026-05-19 18:51:31.095954+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, full_name, is_active, created_at, updated_at) FROM stdin;
1bdf5b05-9c26-4013-8580-c96092a6d38f	test.dashboard@example.com	$2b$12$bplcAlpeKgjd1dd0.DhRkOnr3fecH3aNDocyq2ywv4dl2eIA7ZuVC	owner	Test User	t	2026-05-14 14:36:15.24356+00	2026-05-14 14:36:15.24356+00
2c707788-f466-4779-b930-237cd3ee8498	pepe@mail.com	$2b$12$vbkR/3QVQkalg6YXySFMIuGRFk5KMPLvxnmHqCUCpgq6/Q8xu5KLO	owner	Pepe Garabato	t	2026-05-19 19:29:40.996825+00	2026-05-19 19:29:40.996825+00
\.


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schema_migrations_id_seq', 7, true);


--
-- Name: availability availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT availability_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_confirmation_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_confirmation_token_key UNIQUE (confirmation_token);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_slug_key UNIQUE (slug);


--
-- Name: professional_services professional_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_services
    ADD CONSTRAINT professional_services_pkey PRIMARY KEY (professional_id, service_id);


--
-- Name: professionals professionals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_pkey PRIMARY KEY (id);


--
-- Name: schedule_blocks schedule_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_blocks
    ADD CONSTRAINT schedule_blocks_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_name_key UNIQUE (name);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_availability_day_of_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_day_of_week ON public.availability USING btree (day_of_week);


--
-- Name: idx_availability_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_is_active ON public.availability USING btree (is_active);


--
-- Name: idx_availability_professional_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_professional_id ON public.availability USING btree (professional_id);


--
-- Name: idx_bookings_business_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_business_id ON public.bookings USING btree (business_id);


--
-- Name: idx_bookings_client_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_client_email ON public.bookings USING btree (client_email);


--
-- Name: idx_bookings_confirmation_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_confirmation_token ON public.bookings USING btree (confirmation_token);


--
-- Name: idx_bookings_professional_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_professional_id ON public.bookings USING btree (professional_id);


--
-- Name: idx_bookings_starts_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_starts_at ON public.bookings USING btree (starts_at);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_branches_business_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_business_id ON public.branches USING btree (business_id);


--
-- Name: idx_branches_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_is_active ON public.branches USING btree (is_active);


--
-- Name: idx_businesses_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_owner_id ON public.businesses USING btree (owner_id);


--
-- Name: idx_businesses_plan_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_plan_status ON public.businesses USING btree (plan_status);


--
-- Name: idx_businesses_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_slug ON public.businesses USING btree (slug);


--
-- Name: idx_professional_services_professional; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professional_services_professional ON public.professional_services USING btree (professional_id);


--
-- Name: idx_professional_services_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professional_services_service ON public.professional_services USING btree (service_id);


--
-- Name: idx_professionals_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professionals_branch_id ON public.professionals USING btree (branch_id);


--
-- Name: idx_professionals_business_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professionals_business_id ON public.professionals USING btree (business_id);


--
-- Name: idx_professionals_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professionals_is_active ON public.professionals USING btree (is_active);


--
-- Name: idx_professionals_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_professionals_user_id ON public.professionals USING btree (user_id);


--
-- Name: idx_schedule_blocks_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_blocks_dates ON public.schedule_blocks USING btree (blocked_from, blocked_until);


--
-- Name: idx_schedule_blocks_professional_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_blocks_professional_id ON public.schedule_blocks USING btree (professional_id);


--
-- Name: idx_services_business_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_business_id ON public.services USING btree (business_id);


--
-- Name: idx_services_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_is_active ON public.services USING btree (is_active);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branches update_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: businesses update_businesses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: professionals update_professionals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: availability availability_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT availability_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: branches branches_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: businesses businesses_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: professional_services professional_services_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_services
    ADD CONSTRAINT professional_services_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;


--
-- Name: professional_services professional_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_services
    ADD CONSTRAINT professional_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: professionals professionals_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: professionals professionals_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: professionals professionals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: schedule_blocks schedule_blocks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_blocks
    ADD CONSTRAINT schedule_blocks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: schedule_blocks schedule_blocks_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_blocks
    ADD CONSTRAINT schedule_blocks_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;


--
-- Name: services services_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mVU3UyLKw7msTrdgPpjZkYx4QWXkbMI6txI4tYiaw52ZdFJyn3LrVGpwn3DMKjl

