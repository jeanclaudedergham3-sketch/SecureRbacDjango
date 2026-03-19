--
-- PostgreSQL database dump
--

\restrict 8c0oNEFP3zk5qhuuZg3vbx5PbBoik3hD2dfNtiiEYfmYrqJOLW9118035cAnA3F

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: job_inspections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_inspections (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    scope_of_work text,
    technician_requirements text,
    overview_status character varying(50) DEFAULT 'nt'::character varying NOT NULL,
    submission_status character varying(50) DEFAULT 'not_started'::character varying NOT NULL,
    photos text DEFAULT '[]'::text,
    admin_notes text,
    submitted_by integer,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: job_inspections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_inspections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_inspections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_inspections_id_seq OWNED BY public.job_inspections.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data text,
    is_read boolean DEFAULT false NOT NULL,
    related_entity character varying(100),
    related_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    read_at timestamp without time zone
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    team_id integer NOT NULL,
    technician_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    team_lead_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: technician_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technician_ratings (
    id integer NOT NULL,
    technician_id integer NOT NULL,
    work_order_id integer,
    rating integer NOT NULL,
    comment text,
    rated_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: technician_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.technician_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: technician_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.technician_ratings_id_seq OWNED BY public.technician_ratings.id;


--
-- Name: technicians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technicians (
    id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    specialization character varying(255) NOT NULL,
    experience integer NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    availability character varying(50) DEFAULT 'available'::character varying NOT NULL,
    location character varying(255) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    payment_methods text NOT NULL,
    bank_account character varying(255),
    routing_number character varying(255),
    bank_name character varying(255),
    paypal_email character varying(255),
    venmo_handle character varying(255),
    cashapp_handle character varying(255),
    zelle_info text,
    mailing_address text,
    average_rating numeric(3,2) DEFAULT '0'::numeric,
    total_ratings integer DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    w9_status character varying(50) DEFAULT 'not_submitted'::character varying,
    w9_file_path character varying(500),
    w9_file_name character varying(255),
    w9_submitted_at timestamp without time zone
);


--
-- Name: technicians_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.technicians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: technicians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.technicians_id_seq OWNED BY public.technicians.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    team_id integer
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_order_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_chats (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    user_id integer NOT NULL,
    message text,
    file_url text,
    message_type character varying(50) DEFAULT 'text'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    sender_id integer
);


--
-- Name: work_order_chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_chats_id_seq OWNED BY public.work_order_chats.id;


--
-- Name: work_order_client_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_client_payments (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    payment_type character varying(50) DEFAULT 'full'::character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(100) DEFAULT 'check'::character varying NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    reference_number character varying(255),
    notes text,
    received_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: work_order_client_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_client_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_client_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_client_payments_id_seq OWNED BY public.work_order_client_payments.id;


--
-- Name: work_order_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_files (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(255) NOT NULL,
    category character varying(100) DEFAULT 'general'::character varying NOT NULL,
    uploaded_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: work_order_files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_files_id_seq OWNED BY public.work_order_files.id;


--
-- Name: work_order_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_invoices (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    invoice_number character varying(255) NOT NULL,
    labor_cost numeric(10,2) NOT NULL,
    material_cost numeric(10,2) NOT NULL,
    additional_costs numeric(10,2) DEFAULT '0'::numeric,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(6,4) DEFAULT 0.1 NOT NULL,
    tax_amount numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    sent_at timestamp without time zone,
    paid_at timestamp without time zone
);


--
-- Name: work_order_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_invoices_id_seq OWNED BY public.work_order_invoices.id;


--
-- Name: work_order_parts_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_parts_requests (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    part_name character varying(255) NOT NULL,
    part_number character varying(255),
    quantity integer NOT NULL,
    estimated_cost numeric(10,2),
    supplier character varying(255),
    urgency character varying(50) DEFAULT 'normal'::character varying NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    requested_by integer NOT NULL,
    approved_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone
);


--
-- Name: work_order_parts_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_parts_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_parts_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_parts_requests_id_seq OWNED BY public.work_order_parts_requests.id;


--
-- Name: work_order_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_proposals (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    labor_cost numeric(10,2) DEFAULT '0'::numeric,
    material_cost numeric(10,2) DEFAULT '0'::numeric,
    additional_costs numeric(10,2) DEFAULT '0'::numeric,
    total_cost numeric(10,2) DEFAULT '0'::numeric,
    estimated_duration character varying(255) DEFAULT 'TBD'::character varying,
    description text,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    labor_data text,
    parts_data text,
    services_data text,
    message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone,
    nte_cost numeric(10,2) DEFAULT '0'::numeric,
    technician_cost numeric(10,2) DEFAULT '0'::numeric,
    team_lead_approval character varying(50) DEFAULT 'pending'::character varying,
    team_lead_id integer,
    team_lead_notes text,
    team_lead_approved_at timestamp without time zone
);


--
-- Name: work_order_proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_proposals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_proposals_id_seq OWNED BY public.work_order_proposals.id;


--
-- Name: work_order_technician_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_technician_payments (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    technician_id integer NOT NULL,
    payment_method text NOT NULL,
    amount_requested numeric(10,2) NOT NULL,
    amount_approved numeric(10,2) DEFAULT '0'::numeric,
    amount_paid numeric(10,2) DEFAULT '0'::numeric,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    description text,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone,
    paid_at timestamp without time zone
);


--
-- Name: work_order_technician_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_order_technician_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_order_technician_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_order_technician_payments_id_seq OWNED BY public.work_order_technician_payments.id;


--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_orders (
    id integer NOT NULL,
    work_order_number character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    category character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    requested_by integer NOT NULL,
    assigned_to integer,
    technician_id integer,
    client_name character varying(255),
    client_phone character varying(50),
    client_email character varying(255),
    country character varying(100),
    city character varying(100),
    street text,
    zip_code character varying(20),
    nte numeric(10,2),
    tnte numeric(10,2),
    estimated_hours character varying(20),
    actual_hours numeric(8,2),
    scheduled_date character varying(20),
    start_date character varying(20),
    end_date character varying(20),
    completed_date timestamp without time zone,
    urgency character varying(20),
    equipment_type character varying(255),
    problem_description text,
    special_instructions text,
    access_instructions text,
    safety_requirements text,
    assigned_user_ids text,
    client_work_order_number character varying(255),
    is_locked boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    team_id integer,
    financial_status character varying(50) DEFAULT 'pending'::character varying,
    total_payment numeric(10,2),
    rejection_reason text,
    rejected_at timestamp without time zone,
    is_fast_work_order boolean DEFAULT false NOT NULL
);


--
-- Name: work_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_orders_id_seq OWNED BY public.work_orders.id;


--
-- Name: job_inspections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_inspections ALTER COLUMN id SET DEFAULT nextval('public.job_inspections_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: technician_ratings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technician_ratings ALTER COLUMN id SET DEFAULT nextval('public.technician_ratings_id_seq'::regclass);


--
-- Name: technicians id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians ALTER COLUMN id SET DEFAULT nextval('public.technicians_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_order_chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_chats ALTER COLUMN id SET DEFAULT nextval('public.work_order_chats_id_seq'::regclass);


--
-- Name: work_order_client_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_client_payments ALTER COLUMN id SET DEFAULT nextval('public.work_order_client_payments_id_seq'::regclass);


--
-- Name: work_order_files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_files ALTER COLUMN id SET DEFAULT nextval('public.work_order_files_id_seq'::regclass);


--
-- Name: work_order_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_invoices ALTER COLUMN id SET DEFAULT nextval('public.work_order_invoices_id_seq'::regclass);


--
-- Name: work_order_parts_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_requests ALTER COLUMN id SET DEFAULT nextval('public.work_order_parts_requests_id_seq'::regclass);


--
-- Name: work_order_proposals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_proposals ALTER COLUMN id SET DEFAULT nextval('public.work_order_proposals_id_seq'::regclass);


--
-- Name: work_order_technician_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_technician_payments ALTER COLUMN id SET DEFAULT nextval('public.work_order_technician_payments_id_seq'::regclass);


--
-- Name: work_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders ALTER COLUMN id SET DEFAULT nextval('public.work_orders_id_seq'::regclass);


--
-- Data for Name: job_inspections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_inspections (id, work_order_id, scope_of_work, technician_requirements, overview_status, submission_status, photos, admin_notes, submitted_by, submitted_at, created_at, updated_at) FROM stdin;
1	8	Inspect HVAC unit, check filters and coils		nt	not_started	[]	\N	1	\N	2026-03-18 21:54:04.40571	2026-03-18 21:54:04.40571
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, related_entity, related_id, created_at, read_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, description, category, created_at) FROM stdin;
1	dashboard.view	View dashboard and overview	Dashboard	2025-07-16 15:26:20.233872
2	dashboard.stats	View dashboard statistics	Dashboard	2025-07-16 15:26:20.233872
3	dashboard.widgets	Customize dashboard widgets	Dashboard	2025-07-16 15:26:20.233872
4	analytics.view	View analytics and reports	Analytics	2025-07-16 15:26:20.233872
5	analytics.export	Export analytics data	Analytics	2025-07-16 15:26:20.233872
6	analytics.financial	View financial analytics	Analytics	2025-07-16 15:26:20.233872
7	users.page.view	Access users management page	User Management	2025-07-16 15:26:20.233872
8	users.list.view	View users list	User Management	2025-07-16 15:26:20.233872
9	users.modal.create	Open create user modal	User Management	2025-07-16 15:26:20.233872
10	users.create	Create new users	User Management	2025-07-16 15:26:20.233872
11	users.modal.edit	Open edit user modal	User Management	2025-07-16 15:26:20.233872
12	users.edit	Edit user information	User Management	2025-07-16 15:26:20.233872
13	users.modal.delete	Open delete user confirmation	User Management	2025-07-16 15:26:20.233872
14	users.delete	Delete users	User Management	2025-07-16 15:26:20.233872
15	users.modal.profile	View user profile modal	User Management	2025-07-16 15:26:20.233872
16	users.activate	Activate/deactivate users	User Management	2025-07-16 15:26:20.233872
17	users.reset_password	Reset user passwords	User Management	2025-07-16 15:26:20.233872
18	users.search	Search users	User Management	2025-07-16 15:26:20.233872
19	users.filter	Filter users list	User Management	2025-07-16 15:26:20.233872
20	users.export	Export users data	User Management	2025-07-16 15:26:20.233872
21	roles.page.view	Access roles management page	Role Management	2025-07-16 15:26:20.233872
22	roles.list.view	View roles list	Role Management	2025-07-16 15:26:20.233872
23	roles.modal.create	Open create role modal	Role Management	2025-07-16 15:26:20.233872
24	roles.create	Create new roles	Role Management	2025-07-16 15:26:20.233872
25	roles.modal.edit	Open edit role modal	Role Management	2025-07-16 15:26:20.233872
26	roles.edit	Edit role information	Role Management	2025-07-16 15:26:20.233872
27	roles.modal.delete	Open delete role confirmation	Role Management	2025-07-16 15:26:20.233872
28	roles.delete	Delete roles	Role Management	2025-07-16 15:26:20.233872
29	roles.modal.permissions	Open role permissions modal	Role Management	2025-07-16 15:26:20.233872
30	roles.assign	Assign roles to users	Role Management	2025-07-16 15:26:20.233872
31	permissions.view	View permissions	Role Management	2025-07-16 15:26:20.233872
32	permissions.assign	Assign permissions to roles	Role Management	2025-07-16 15:26:20.233872
33	technicians.page.view	Access technicians management page	Technician Management	2025-07-16 15:26:20.233872
34	technicians.list.view	View technicians list	Technician Management	2025-07-16 15:26:20.233872
35	technicians.modal.create	Open create technician modal	Technician Management	2025-07-16 15:26:20.233872
36	technicians.create	Create new technicians	Technician Management	2025-07-16 15:26:20.233872
37	technicians.modal.edit	Open edit technician modal	Technician Management	2025-07-16 15:26:20.233872
38	technicians.edit	Edit technician information	Technician Management	2025-07-16 15:26:20.233872
39	technicians.modal.delete	Open delete technician confirmation	Technician Management	2025-07-16 15:26:20.233872
40	technicians.delete	Delete technicians	Technician Management	2025-07-16 15:26:20.233872
41	technicians.modal.rate	Open technician rating modal	Technician Management	2025-07-16 15:26:20.233872
42	technicians.rate	Rate technicians	Technician Management	2025-07-16 15:26:20.233872
43	technicians.modal.profile	View technician profile modal	Technician Management	2025-07-16 15:26:20.233872
44	technicians.map.view	Access technician map page	Technician Management	2025-07-16 15:26:20.233872
45	technicians.map	View technician map	Technician Management	2025-07-16 15:26:20.233872
46	technicians.location	View technician locations	Technician Management	2025-07-16 15:26:20.233872
47	technicians.search	Search technicians	Technician Management	2025-07-16 15:26:20.233872
48	workorders.page.view	Access work orders page	Work Order Management	2025-07-16 15:26:20.233872
49	workorders.list.view	View work orders list	Work Order Management	2025-07-16 15:26:20.233872
50	workorders.modal.create	Open create work order modal	Work Order Management	2025-07-16 15:26:20.233872
51	workorders.create	Create new work orders	Work Order Management	2025-07-16 15:26:20.233872
52	workorders.modal.edit	Open edit work order modal	Work Order Management	2025-07-16 15:26:20.233872
53	workorders.edit	Edit work order information	Work Order Management	2025-07-16 15:26:20.233872
54	workorders.modal.details	Open work order details modal	Work Order Management	2025-07-16 15:26:20.233872
55	workorders.details.view	View work order details	Work Order Management	2025-07-16 15:26:20.233872
56	workorders.modal.delete	Open delete work order confirmation	Work Order Management	2025-07-16 15:26:20.233872
57	workorders.delete	Delete work orders	Work Order Management	2025-07-16 15:26:20.233872
58	workorders.modal.assign	Open technician assignment modal	Work Order Management	2025-07-16 15:26:20.233872
59	workorders.assign	Assign technicians to work orders	Work Order Management	2025-07-16 15:26:20.233872
60	workorders.status	Update work order status	Work Order Management	2025-07-16 15:26:20.233872
61	workorders.priority	Change work order priority	Work Order Management	2025-07-16 15:26:20.233872
62	workorders.close	Close completed work orders	Work Order Management	2025-07-16 15:26:20.233872
63	workorders.search	Search work orders	Work Order Management	2025-07-16 15:26:20.233872
64	workorders.filter	Filter work orders	Work Order Management	2025-07-16 15:26:20.233872
65	workorders.export	Export work orders data	Work Order Management	2025-07-16 15:26:20.233872
66	workorders.tab.overview	View work order overview tab	Work Order Details	2025-07-16 15:26:20.233872
67	workorders.tab.proposal	View work order proposal tab	Work Order Details	2025-07-16 15:26:20.233872
68	workorders.tab.parts	View work order parts tab	Work Order Details	2025-07-16 15:26:20.233872
69	workorders.tab.files	View work order files tab	Work Order Details	2025-07-16 15:26:20.233872
70	workorders.tab.chat	View work order chat tab	Work Order Details	2025-07-16 15:26:20.233872
71	workorders.tab.payments	View work order payments tab	Work Order Details	2025-07-16 15:26:20.233872
72	workorders.tab.invoice	View work order invoice tab	Work Order Details	2025-07-16 15:26:20.233872
73	proposals.page.view	Access proposals page	Proposal Management	2025-07-16 15:26:20.233872
74	proposals.list.view	View proposals list	Proposal Management	2025-07-16 15:26:20.233872
75	proposals.modal.create	Open create proposal modal	Proposal Management	2025-07-16 15:26:20.233872
76	proposals.create	Create new proposals	Proposal Management	2025-07-16 15:26:20.233872
77	proposals.modal.edit	Open edit proposal modal	Proposal Management	2025-07-16 15:26:20.233872
78	proposals.edit	Edit proposals	Proposal Management	2025-07-16 15:26:20.233872
79	proposals.modal.details	Open proposal details modal	Proposal Management	2025-07-16 15:26:20.233872
80	proposals.modal.delete	Open delete proposal confirmation	Proposal Management	2025-07-16 15:26:20.233872
81	proposals.delete	Delete proposals	Proposal Management	2025-07-16 15:26:20.233872
82	proposals.modal.approve	Open proposal approval modal	Proposal Management	2025-07-16 15:26:20.233872
83	proposals.approve	Approve proposals	Proposal Management	2025-07-16 15:26:20.233872
84	proposals.modal.reject	Open proposal rejection modal	Proposal Management	2025-07-16 15:26:20.233872
85	proposals.reject	Reject proposals	Proposal Management	2025-07-16 15:26:20.233872
86	proposals.search	Search proposals	Proposal Management	2025-07-16 15:26:20.233872
87	proposals.filter	Filter proposals	Proposal Management	2025-07-16 15:26:20.233872
88	parts.page.view	Access parts requests page	Parts Management	2025-07-16 15:26:20.233872
89	parts.list.view	View parts requests list	Parts Management	2025-07-16 15:26:20.233872
90	parts.modal.create	Open create parts request modal	Parts Management	2025-07-16 15:26:20.233872
91	parts.create	Create parts requests	Parts Management	2025-07-16 15:26:20.233872
92	parts.modal.edit	Open edit parts request modal	Parts Management	2025-07-16 15:26:20.233872
93	parts.edit	Edit parts requests	Parts Management	2025-07-16 15:26:20.233872
94	parts.modal.details	Open parts request details modal	Parts Management	2025-07-16 15:26:20.233872
95	parts.modal.approve	Open parts approval modal	Parts Management	2025-07-16 15:26:20.233872
96	parts.approve	Approve parts requests	Parts Management	2025-07-16 15:26:20.233872
97	parts.modal.reject	Open parts rejection modal	Parts Management	2025-07-16 15:26:20.233872
98	parts.reject	Reject parts requests	Parts Management	2025-07-16 15:26:20.233872
99	parts.order	Order approved parts	Parts Management	2025-07-16 15:26:20.233872
100	parts.search	Search parts requests	Parts Management	2025-07-16 15:26:20.233872
101	files.modal.upload	Open file upload modal	File Management	2025-07-16 15:26:20.233872
102	files.upload	Upload files	File Management	2025-07-16 15:26:20.233872
103	files.modal.preview	Open file preview modal	File Management	2025-07-16 15:26:20.233872
104	files.view	View uploaded files	File Management	2025-07-16 15:26:20.233872
105	files.download	Download files	File Management	2025-07-16 15:26:20.233872
106	files.modal.delete	Open file delete confirmation	File Management	2025-07-16 15:26:20.233872
107	files.delete	Delete files	File Management	2025-07-16 15:26:20.233872
108	files.categorize	Categorize files	File Management	2025-07-16 15:26:20.233872
109	chat.modal.open	Open chat modal	Communication	2025-07-16 15:26:20.233872
110	chat.view	View chat messages	Communication	2025-07-16 15:26:20.233872
111	chat.send	Send chat messages	Communication	2025-07-16 15:26:20.233872
112	chat.history	View chat history	Communication	2025-07-16 15:26:20.233872
113	notifications.modal.view	Open notifications modal	Communication	2025-07-16 15:26:20.233872
114	notifications.view	View notifications	Communication	2025-07-16 15:26:20.233872
115	notifications.modal.create	Open create notification modal	Communication	2025-07-16 15:26:20.233872
116	notifications.create	Create notifications	Communication	2025-07-16 15:26:20.233872
117	notifications.delete	Delete notifications	Communication	2025-07-16 15:26:20.233872
118	notifications.mark_read	Mark notifications as read	Communication	2025-07-16 15:26:20.233872
119	payments.page.view	Access payments page	Payment Management	2025-07-16 15:26:20.233872
120	payments.list.view	View payment information	Payment Management	2025-07-16 15:26:20.233872
121	payments.modal.create	Open payment request modal	Payment Management	2025-07-16 15:26:20.233872
122	payments.create	Create payment requests	Payment Management	2025-07-16 15:26:20.233872
123	payments.modal.details	Open payment details modal	Payment Management	2025-07-16 15:26:20.233872
124	payments.modal.approve	Open payment approval modal	Payment Management	2025-07-16 15:26:20.233872
125	payments.approve	Approve payments	Payment Management	2025-07-16 15:26:20.233872
126	payments.modal.process	Open payment processing modal	Payment Management	2025-07-16 15:26:20.233872
127	payments.process	Process payments	Payment Management	2025-07-16 15:26:20.233872
128	payments.history	View payment history	Payment Management	2025-07-16 15:26:20.233872
129	payments.technician.view	Access technician payments page	Payment Management	2025-07-16 15:26:20.233872
130	payments.technician	View technician payments	Payment Management	2025-07-16 15:26:20.233872
131	payments.search	Search payments	Payment Management	2025-07-16 15:26:20.233872
132	invoices.page.view	Access invoices page	Invoice Management	2025-07-16 15:26:20.233872
133	invoices.list.view	View invoices list	Invoice Management	2025-07-16 15:26:20.233872
134	invoices.modal.create	Open create invoice modal	Invoice Management	2025-07-16 15:26:20.233872
135	invoices.create	Create invoices	Invoice Management	2025-07-16 15:26:20.233872
136	invoices.modal.edit	Open edit invoice modal	Invoice Management	2025-07-16 15:26:20.233872
137	invoices.edit	Edit invoices	Invoice Management	2025-07-16 15:26:20.233872
138	invoices.modal.details	Open invoice details modal	Invoice Management	2025-07-16 15:26:20.233872
139	invoices.modal.preview	Open invoice preview modal	Invoice Management	2025-07-16 15:26:20.233872
140	invoices.modal.send	Open send invoice modal	Invoice Management	2025-07-16 15:26:20.233872
141	invoices.modal.delete	Open delete invoice confirmation	Invoice Management	2025-07-16 15:26:20.233872
142	invoices.delete	Delete invoices	Invoice Management	2025-07-16 15:26:20.233872
143	invoices.send	Send invoices to clients	Invoice Management	2025-07-16 15:26:20.233872
144	invoices.export	Export invoice data	Invoice Management	2025-07-16 15:26:20.233872
145	invoices.search	Search invoices	Invoice Management	2025-07-16 15:26:20.233872
146	financial.page.view	Access financial analysis page	Financial Analysis	2025-07-16 15:26:20.233872
147	financial.view	View financial analysis	Financial Analysis	2025-07-16 15:26:20.233872
148	financial.reports	Generate financial reports	Financial Analysis	2025-07-16 15:26:20.233872
149	financial.export	Export financial data	Financial Analysis	2025-07-16 15:26:20.233872
150	financial.charts	View financial charts	Financial Analysis	2025-07-16 15:26:20.233872
151	financial.comparison	View profit/loss comparison	Financial Analysis	2025-07-16 15:26:20.233872
152	sidebar.overview	Access overview section	Navigation	2025-07-16 15:26:20.233872
153	sidebar.user_management	Access user management section	Navigation	2025-07-16 15:26:20.233872
154	sidebar.operations	Access operations section	Navigation	2025-07-16 15:26:20.233872
155	sidebar.technicians	Access technicians section	Navigation	2025-07-16 15:26:20.233872
156	sidebar.payments	Access payments section	Navigation	2025-07-16 15:26:20.233872
157	buttons.create	Show create buttons	Interface Controls	2025-07-16 15:26:20.233872
158	buttons.edit	Show edit buttons	Interface Controls	2025-07-16 15:26:20.233872
159	buttons.delete	Show delete buttons	Interface Controls	2025-07-16 15:26:20.233872
160	buttons.approve	Show approve buttons	Interface Controls	2025-07-16 15:26:20.233872
161	buttons.reject	Show reject buttons	Interface Controls	2025-07-16 15:26:20.233872
162	buttons.export	Show export buttons	Interface Controls	2025-07-16 15:26:20.233872
163	buttons.search	Show search functionality	Interface Controls	2025-07-16 15:26:20.233872
164	buttons.filter	Show filter functionality	Interface Controls	2025-07-16 15:26:20.233872
165	modals.resize	Resize modal windows	Modal Controls	2025-07-16 15:26:20.233872
166	modals.fullscreen	Fullscreen modal view	Modal Controls	2025-07-16 15:26:20.233872
167	modals.print	Print modal content	Modal Controls	2025-07-16 15:26:20.233872
168	modals.bookmark	Bookmark modal content	Modal Controls	2025-07-16 15:26:20.233872
169	data.export.csv	Export data as CSV	Data Management	2025-07-16 15:26:20.233872
170	data.export.excel	Export data as Excel	Data Management	2025-07-16 15:26:20.233872
171	data.export.pdf	Export data as PDF	Data Management	2025-07-16 15:26:20.233872
172	data.import	Import data from files	Data Management	2025-07-16 15:26:20.233872
173	data.bulk_operations	Perform bulk operations	Data Management	2025-07-16 15:26:20.233872
174	system.admin	Full system administration	System Administration	2025-07-16 15:26:20.233872
175	system.settings	Manage system settings	System Administration	2025-07-16 15:26:20.233872
176	system.logs	View system logs	System Administration	2025-07-16 15:26:20.233872
177	system.backup	Create system backups	System Administration	2025-07-16 15:26:20.233872
178	system.maintenance	Perform system maintenance	System Administration	2025-07-16 15:26:20.233872
179	system.security	Manage security settings	System Administration	2025-07-16 15:26:20.233872
180	system.audit	View audit trails	System Administration	2025-07-16 15:26:20.233872
181	workorders.view_all	View all work orders in the system	Work Order Management	2025-07-30 22:55:13.397995
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role_id, permission_id, assigned_at) FROM stdin;
1045	2	2	2025-08-27 17:56:14.314139
1047	2	4	2025-08-27 17:56:14.416402
1048	2	5	2025-08-27 17:56:14.468134
1049	2	6	2025-08-27 17:56:14.519253
1050	2	21	2025-08-27 17:56:14.571703
1051	2	22	2025-08-27 17:56:14.623161
1052	2	23	2025-08-27 17:56:14.674708
1053	2	24	2025-08-27 17:56:14.72585
1054	2	25	2025-08-27 17:56:14.781
1055	2	26	2025-08-27 17:56:14.833382
1056	2	27	2025-08-27 17:56:14.885334
1057	2	28	2025-08-27 17:56:14.936691
1058	2	29	2025-08-27 17:56:14.988068
1059	2	30	2025-08-27 17:56:15.040232
1060	2	31	2025-08-27 17:56:15.093521
1061	2	32	2025-08-27 17:56:15.14498
1062	2	7	2025-08-27 17:56:15.195009
1063	2	8	2025-08-27 17:56:15.246156
1064	2	9	2025-08-27 17:56:15.302212
1065	2	10	2025-08-27 17:56:15.35307
1066	2	11	2025-08-27 17:56:15.404426
1067	2	12	2025-08-27 17:56:15.464163
1068	2	13	2025-08-27 17:56:15.515228
1069	2	14	2025-08-27 17:56:15.567086
1070	2	15	2025-08-27 17:56:15.618587
1071	2	16	2025-08-27 17:56:15.674501
1072	2	17	2025-08-27 17:56:15.727884
1073	2	18	2025-08-27 17:56:15.781616
1074	2	19	2025-08-27 17:56:15.836159
1075	2	20	2025-08-27 17:56:15.888285
1078	2	50	2025-08-27 17:56:16.04543
1079	2	51	2025-08-27 17:56:16.097003
1081	2	53	2025-08-27 17:56:16.203965
1083	2	55	2025-08-27 17:56:16.308005
1084	2	56	2025-08-27 17:56:16.367607
1085	2	57	2025-08-27 17:56:16.419406
1090	2	62	2025-08-27 17:56:16.678246
1092	2	64	2025-08-27 17:56:16.789462
1093	2	65	2025-08-27 17:56:16.846868
1094	2	181	2025-08-27 17:56:16.898995
1095	2	33	2025-08-27 17:56:16.960537
1096	2	34	2025-08-27 17:56:17.015325
1097	2	35	2025-08-27 17:56:17.066575
1098	2	36	2025-08-27 17:56:17.119548
1099	2	37	2025-08-27 17:56:17.172676
1100	2	38	2025-08-27 17:56:17.224667
1101	2	39	2025-08-27 17:56:17.276644
1102	2	40	2025-08-27 17:56:17.331867
1103	2	41	2025-08-27 17:56:17.38698
1104	2	42	2025-08-27 17:56:17.439023
1105	2	43	2025-08-27 17:56:17.493985
1106	2	44	2025-08-27 17:56:17.54591
1107	2	45	2025-08-27 17:56:17.600329
1108	2	46	2025-08-27 17:56:17.651951
1109	2	47	2025-08-27 17:56:17.70349
1112	2	75	2025-08-27 17:56:17.862255
1113	2	76	2025-08-27 17:56:17.916726
1114	2	77	2025-08-27 17:56:17.970114
1115	2	78	2025-08-27 17:56:18.024835
1116	2	79	2025-08-27 17:56:18.078579
1117	2	80	2025-08-27 17:56:18.129996
1118	2	81	2025-08-27 17:56:18.181581
1119	2	82	2025-08-27 17:56:18.235724
1120	2	83	2025-08-27 17:56:18.288281
1121	2	84	2025-08-27 17:56:18.339759
1122	2	85	2025-08-27 17:56:18.390765
1123	2	86	2025-08-27 17:56:18.442708
1124	2	87	2025-08-27 17:56:18.494129
1131	2	72	2025-08-27 17:56:18.864631
1132	2	101	2025-08-27 17:56:18.915976
1133	2	102	2025-08-27 17:56:18.96842
1137	2	106	2025-08-27 17:56:19.184596
1138	2	107	2025-08-27 17:56:19.240029
1140	2	88	2025-08-27 17:56:19.343885
1141	2	89	2025-08-27 17:56:19.39522
1007	1	95	2025-08-27 17:48:07.050505
1008	1	96	2025-08-27 17:48:07.102959
1144	2	92	2025-08-27 17:56:19.550719
1009	1	97	2025-08-27 17:48:07.169583
1010	1	98	2025-08-27 17:48:07.222418
1011	1	99	2025-08-27 17:48:07.27378
1147	2	95	2025-08-27 17:56:19.705257
1013	1	101	2025-08-27 17:48:07.376228
1014	1	102	2025-08-27 17:48:07.427985
1148	2	96	2025-08-27 17:56:19.756485
1149	2	97	2025-08-27 17:56:19.809896
1018	1	106	2025-08-27 17:48:07.640491
1150	2	98	2025-08-27 17:56:19.860851
1019	1	107	2025-08-27 17:48:07.692828
1151	2	99	2025-08-27 17:56:19.912592
1153	2	119	2025-08-27 17:56:20.015457
1154	2	120	2025-08-27 17:56:20.06695
1031	1	157	2025-08-27 17:48:08.326906
1032	1	158	2025-08-27 17:48:08.378011
1033	1	159	2025-08-27 17:48:08.429231
1155	2	121	2025-08-27 17:56:20.117929
1034	1	160	2025-08-27 17:48:08.482178
1035	1	161	2025-08-27 17:48:08.534801
1036	1	162	2025-08-27 17:48:08.588608
1156	2	122	2025-08-27 17:56:20.169258
1157	2	123	2025-08-27 17:56:20.222671
1040	1	153	2025-08-27 17:48:08.799622
1043	1	156	2025-08-27 17:48:08.953249
1158	2	124	2025-08-27 17:56:20.27371
1159	2	125	2025-08-27 17:56:20.328007
1160	2	126	2025-08-27 17:56:20.382051
1161	2	127	2025-08-27 17:56:20.435873
1162	2	128	2025-08-27 17:56:20.490248
1163	2	129	2025-08-27 17:56:20.541451
1164	2	130	2025-08-27 17:56:20.592657
1165	2	131	2025-08-27 17:56:20.644396
1176	2	146	2025-08-27 17:56:21.21135
1177	2	147	2025-08-27 17:56:21.262583
1178	2	148	2025-08-27 17:56:21.314805
1179	2	149	2025-08-27 17:56:21.366423
1180	2	150	2025-08-27 17:56:21.417899
1181	2	151	2025-08-27 17:56:21.468995
1182	2	132	2025-08-27 17:56:21.520948
1183	2	133	2025-08-27 17:56:21.571917
1184	2	134	2025-08-27 17:56:21.623217
1185	2	135	2025-08-27 17:56:21.676546
1186	2	136	2025-08-27 17:56:21.727314
1187	2	137	2025-08-27 17:56:21.778764
1188	2	138	2025-08-27 17:56:21.829792
1189	2	139	2025-08-27 17:56:21.881068
1190	2	140	2025-08-27 17:56:21.933658
1191	2	141	2025-08-27 17:56:21.986017
1192	2	142	2025-08-27 17:56:22.04099
1193	2	143	2025-08-27 17:56:22.092885
1194	2	144	2025-08-27 17:56:22.144901
1195	2	145	2025-08-27 17:56:22.197067
1196	2	157	2025-08-27 17:56:22.24829
1197	2	158	2025-08-27 17:56:22.300633
1198	2	159	2025-08-27 17:56:22.354105
1199	2	160	2025-08-27 17:56:22.405845
1200	2	161	2025-08-27 17:56:22.456812
1201	2	162	2025-08-27 17:56:22.507664
1205	2	153	2025-08-27 17:56:22.712628
1208	2	156	2025-08-27 17:56:22.866431
1209	2	165	2025-08-27 17:56:22.918546
1210	2	166	2025-08-27 17:56:22.970995
1211	2	167	2025-08-27 17:56:23.023132
1212	2	168	2025-08-27 17:56:23.074491
1213	2	174	2025-08-27 17:56:23.125547
1214	2	175	2025-08-27 17:56:23.177409
1215	2	176	2025-08-27 17:56:23.228364
1216	2	177	2025-08-27 17:56:23.280062
1217	2	178	2025-08-27 17:56:23.332506
1218	2	179	2025-08-27 17:56:23.385159
1219	2	180	2025-08-27 17:56:23.436274
1220	2	169	2025-08-27 17:56:23.487681
1221	2	170	2025-08-27 17:56:23.538696
1222	2	171	2025-08-27 17:56:23.590819
1223	2	172	2025-08-27 17:56:23.642064
1224	2	173	2025-08-27 17:56:23.692071
1278	4	55	2025-12-08 22:57:31.874524
1280	4	64	2025-12-08 22:57:31.874524
1287	4	72	2025-12-08 22:57:31.874524
1290	4	79	2025-12-08 22:57:31.874524
1291	4	86	2025-12-08 22:57:31.874524
1292	4	88	2025-12-08 22:57:31.874524
1293	4	89	2025-12-08 22:57:31.874524
1302	4	119	2025-12-08 22:57:31.874524
1303	4	120	2025-12-08 22:57:31.874524
1304	4	123	2025-12-08 22:57:31.874524
1305	4	131	2025-12-08 22:57:31.874524
1306	4	132	2025-12-08 22:57:31.874524
1307	4	133	2025-12-08 22:57:31.874524
1308	4	138	2025-12-08 22:57:31.874524
1309	4	139	2025-12-08 22:57:31.874524
1310	4	145	2025-12-08 22:57:31.874524
1311	4	146	2025-12-08 22:57:31.874524
1312	4	147	2025-12-08 22:57:31.874524
1316	4	156	2025-12-08 22:57:31.874524
1226	3	2	2025-12-08 22:57:06.202761
1227	3	33	2025-12-08 22:57:06.202761
1228	3	34	2025-12-08 22:57:06.202761
1232	3	55	2025-12-08 22:57:06.202761
1235	3	64	2025-12-08 22:57:06.202761
1241	3	88	2025-12-08 22:57:06.202761
1242	3	89	2025-12-08 22:57:06.202761
1247	3	101	2025-12-08 22:57:06.202761
1248	3	102	2025-12-08 22:57:06.202761
1261	3	157	2025-12-08 22:57:06.202761
1319	5	1	2026-03-11 17:00:04.718823
1320	5	3	2026-03-11 17:00:04.828863
1321	5	48	2026-03-11 17:00:04.926641
1322	5	49	2026-03-11 17:00:05.028441
1323	5	52	2026-03-11 17:00:05.12564
1324	5	54	2026-03-11 17:00:05.223179
1325	5	58	2026-03-11 17:00:05.319764
1326	5	59	2026-03-11 17:00:05.41711
1327	5	60	2026-03-11 17:00:05.515775
1328	5	61	2026-03-11 17:00:05.615098
1329	5	63	2026-03-11 17:00:05.711741
1330	5	66	2026-03-11 17:00:05.810052
1331	5	67	2026-03-11 17:00:05.907561
1332	5	68	2026-03-11 17:00:06.004461
1333	5	69	2026-03-11 17:00:06.101048
1334	5	70	2026-03-11 17:00:06.198163
1335	5	71	2026-03-11 17:00:06.295419
1336	5	73	2026-03-11 17:00:06.393674
1337	5	74	2026-03-11 17:00:06.490689
1338	5	90	2026-03-11 17:00:06.589473
1339	5	91	2026-03-11 17:00:06.687987
1340	5	93	2026-03-11 17:00:06.784702
1341	5	94	2026-03-11 17:00:06.883716
1342	5	100	2026-03-11 17:00:06.981585
1343	5	109	2026-03-11 17:00:07.079979
1344	5	110	2026-03-11 17:00:07.176656
1345	5	111	2026-03-11 17:00:07.273193
1346	5	112	2026-03-11 17:00:07.369061
1347	5	113	2026-03-11 17:00:07.470856
1348	5	114	2026-03-11 17:00:07.57182
1349	5	115	2026-03-11 17:00:07.668151
1350	5	116	2026-03-11 17:00:07.766293
1351	5	117	2026-03-11 17:00:07.868261
1352	5	118	2026-03-11 17:00:07.965254
1353	5	152	2026-03-11 17:00:08.063231
1354	5	155	2026-03-11 17:00:08.162277
1355	5	163	2026-03-11 17:00:08.26344
1356	5	164	2026-03-11 17:00:08.362429
1357	5	103	2026-03-11 17:00:08.459473
1358	5	104	2026-03-11 17:00:08.556993
1359	5	105	2026-03-11 17:00:08.654589
1360	5	108	2026-03-11 17:00:08.752708
1361	5	154	2026-03-11 17:00:08.84991
1362	5	36	2026-03-11 17:00:08.947845
1363	5	37	2026-03-11 17:00:09.045489
1364	5	38	2026-03-11 17:00:09.146598
1365	5	75	2026-03-11 17:00:09.244568
1366	5	76	2026-03-11 17:00:09.345966
1367	5	77	2026-03-11 17:00:09.443733
1368	5	78	2026-03-11 17:00:09.540489
1265	4	2	2025-12-08 22:57:31.874524
1267	4	4	2025-12-08 22:57:31.874524
1268	4	7	2025-12-08 22:57:31.874524
1269	4	8	2025-12-08 22:57:31.874524
1270	4	21	2025-12-08 22:57:31.874524
1271	4	22	2025-12-08 22:57:31.874524
1272	4	33	2025-12-08 22:57:31.874524
1273	4	34	2025-12-08 22:57:31.874524
863	1	4	2025-08-27 17:47:59.537412
1274	4	44	2025-12-08 22:57:31.874524
864	1	5	2025-08-27 17:47:59.589731
865	1	6	2025-08-27 17:47:59.642417
866	1	7	2025-08-27 17:47:59.69361
867	1	8	2025-08-27 17:47:59.745331
868	1	9	2025-08-27 17:47:59.799159
869	1	10	2025-08-27 17:47:59.851488
870	1	11	2025-08-27 17:47:59.903625
871	1	12	2025-08-27 17:47:59.955642
872	1	13	2025-08-27 17:48:00.006276
873	1	14	2025-08-27 17:48:00.066191
874	1	15	2025-08-27 17:48:00.119575
875	1	16	2025-08-27 17:48:00.178905
876	1	17	2025-08-27 17:48:00.232647
877	1	18	2025-08-27 17:48:00.284927
878	1	19	2025-08-27 17:48:00.336017
879	1	20	2025-08-27 17:48:00.387607
880	1	21	2025-08-27 17:48:00.441176
881	1	22	2025-08-27 17:48:00.492422
882	1	23	2025-08-27 17:48:00.544099
883	1	24	2025-08-27 17:48:00.596199
884	1	25	2025-08-27 17:48:00.653641
885	1	26	2025-08-27 17:48:00.705717
886	1	27	2025-08-27 17:48:00.757002
887	1	28	2025-08-27 17:48:00.808779
888	1	29	2025-08-27 17:48:00.86035
889	1	30	2025-08-27 17:48:00.911821
890	1	31	2025-08-27 17:48:00.967007
891	1	32	2025-08-27 17:48:01.019221
892	1	33	2025-08-27 17:48:01.070589
893	1	34	2025-08-27 17:48:01.122449
894	1	35	2025-08-27 17:48:01.174373
895	1	36	2025-08-27 17:48:01.227374
896	1	37	2025-08-27 17:48:01.283183
897	1	38	2025-08-27 17:48:01.336323
898	1	39	2025-08-27 17:48:01.390384
899	1	40	2025-08-27 17:48:01.442545
900	1	41	2025-08-27 17:48:01.494421
901	1	42	2025-08-27 17:48:01.545582
902	1	43	2025-08-27 17:48:01.597205
903	1	44	2025-08-27 17:48:01.649148
904	1	45	2025-08-27 17:48:01.705751
905	1	46	2025-08-27 17:48:01.757604
906	1	47	2025-08-27 17:48:01.809017
907	1	119	2025-08-27 17:48:01.859438
908	1	120	2025-08-27 17:48:01.910944
909	1	121	2025-08-27 17:48:01.962033
910	1	122	2025-08-27 17:48:02.01459
911	1	123	2025-08-27 17:48:02.065756
912	1	124	2025-08-27 17:48:02.116765
913	1	125	2025-08-27 17:48:02.167809
914	1	126	2025-08-27 17:48:02.219333
915	1	127	2025-08-27 17:48:02.270605
916	1	128	2025-08-27 17:48:02.322767
917	1	129	2025-08-27 17:48:02.374569
918	1	130	2025-08-27 17:48:02.426597
919	1	131	2025-08-27 17:48:02.477577
920	1	132	2025-08-27 17:48:02.528728
921	1	133	2025-08-27 17:48:02.580317
922	1	134	2025-08-27 17:48:02.631369
923	1	135	2025-08-27 17:48:02.68246
924	1	136	2025-08-27 17:48:02.73303
925	1	137	2025-08-27 17:48:02.784516
926	1	138	2025-08-27 17:48:02.837785
927	1	139	2025-08-27 17:48:02.891613
928	1	140	2025-08-27 17:48:02.942849
929	1	141	2025-08-27 17:48:02.993927
930	1	142	2025-08-27 17:48:03.045268
931	1	143	2025-08-27 17:48:03.097084
932	1	144	2025-08-27 17:48:03.152579
933	1	145	2025-08-27 17:48:03.204695
934	1	146	2025-08-27 17:48:03.260918
935	1	147	2025-08-27 17:48:03.312869
936	1	148	2025-08-27 17:48:03.365798
937	1	149	2025-08-27 17:48:03.420732
938	1	150	2025-08-27 17:48:03.471055
939	1	151	2025-08-27 17:48:03.522117
940	1	165	2025-08-27 17:48:03.57425
941	1	166	2025-08-27 17:48:03.625584
942	1	167	2025-08-27 17:48:03.677008
943	1	168	2025-08-27 17:48:03.728086
944	1	169	2025-08-27 17:48:03.779208
945	1	170	2025-08-27 17:48:03.830548
946	1	171	2025-08-27 17:48:03.881735
947	1	172	2025-08-27 17:48:03.932851
948	1	173	2025-08-27 17:48:03.984244
949	1	174	2025-08-27 17:48:04.037053
950	1	175	2025-08-27 17:48:04.088512
951	1	176	2025-08-27 17:48:04.140541
952	1	177	2025-08-27 17:48:04.191652
953	1	178	2025-08-27 17:48:04.2438
954	1	179	2025-08-27 17:48:04.295325
955	1	180	2025-08-27 17:48:04.346478
957	1	2	2025-08-27 17:48:04.44889
961	1	50	2025-08-27 17:48:04.653108
962	1	51	2025-08-27 17:48:04.70424
964	1	53	2025-08-27 17:48:04.806275
966	1	55	2025-08-27 17:48:04.911627
967	1	56	2025-08-27 17:48:04.964682
968	1	57	2025-08-27 17:48:05.015846
973	1	62	2025-08-27 17:48:05.2744
975	1	64	2025-08-27 17:48:05.378576
976	1	65	2025-08-27 17:48:05.429723
977	1	181	2025-08-27 17:48:05.480751
980	1	75	2025-08-27 17:48:05.636003
981	1	76	2025-08-27 17:48:05.688019
982	1	77	2025-08-27 17:48:05.743951
983	1	78	2025-08-27 17:48:05.796453
984	1	79	2025-08-27 17:48:05.848261
985	1	80	2025-08-27 17:48:05.901654
986	1	81	2025-08-27 17:48:05.954638
987	1	82	2025-08-27 17:48:06.00725
988	1	83	2025-08-27 17:48:06.059238
989	1	84	2025-08-27 17:48:06.110442
990	1	85	2025-08-27 17:48:06.161666
991	1	86	2025-08-27 17:48:06.213784
992	1	87	2025-08-27 17:48:06.264974
999	1	72	2025-08-27 17:48:06.629128
1000	1	88	2025-08-27 17:48:06.680689
1001	1	89	2025-08-27 17:48:06.733605
1004	1	92	2025-08-27 17:48:06.895938
1369	6	1	2026-03-11 21:27:31.900161
1370	6	2	2026-03-11 21:27:31.904929
1371	6	33	2026-03-11 21:27:31.908775
1372	6	34	2026-03-11 21:27:31.9135
1373	6	44	2026-03-11 21:27:31.917388
1374	6	45	2026-03-11 21:27:31.921608
1375	6	48	2026-03-11 21:27:31.925415
1376	6	49	2026-03-11 21:27:31.930046
1377	6	55	2026-03-11 21:27:31.933748
1378	6	63	2026-03-11 21:27:31.937345
1379	6	64	2026-03-11 21:27:31.941097
1380	6	66	2026-03-11 21:27:31.945636
1381	6	68	2026-03-11 21:27:31.949112
1382	6	69	2026-03-11 21:27:31.95275
1383	6	88	2026-03-11 21:27:31.95665
1384	6	89	2026-03-11 21:27:31.961547
1385	6	90	2026-03-11 21:27:31.965209
1386	6	91	2026-03-11 21:27:31.968798
1387	6	96	2026-03-11 21:27:31.972217
1388	6	99	2026-03-11 21:27:31.976319
1389	6	102	2026-03-11 21:27:31.979842
1390	6	104	2026-03-11 21:27:31.983363
1391	6	105	2026-03-11 21:27:31.987274
1392	6	114	2026-03-11 21:27:31.991606
1393	6	118	2026-03-11 21:27:31.995202
1394	6	152	2026-03-11 21:27:31.999479
1395	6	154	2026-03-11 21:27:32.003309
1396	6	155	2026-03-11 21:27:32.007349
1397	6	157	2026-03-11 21:27:32.010986
1398	6	163	2026-03-11 21:27:32.014519
1399	6	164	2026-03-11 21:27:32.018089
1400	7	1	2026-03-11 21:27:32.028714
1401	7	2	2026-03-11 21:27:32.032685
1402	7	4	2026-03-11 21:27:32.036347
1403	7	6	2026-03-11 21:27:32.040508
1404	7	48	2026-03-11 21:27:32.044589
1405	7	49	2026-03-11 21:27:32.048848
1406	7	55	2026-03-11 21:27:32.052665
1407	7	63	2026-03-11 21:27:32.056843
1408	7	66	2026-03-11 21:27:32.061425
1409	7	71	2026-03-11 21:27:32.06512
1410	7	72	2026-03-11 21:27:32.068783
1411	7	114	2026-03-11 21:27:32.072749
1412	7	118	2026-03-11 21:27:32.076894
1413	7	119	2026-03-11 21:27:32.081249
1414	7	120	2026-03-11 21:27:32.084956
1415	7	121	2026-03-11 21:27:32.089176
1416	7	122	2026-03-11 21:27:32.092668
1417	7	125	2026-03-11 21:27:32.096764
1418	7	127	2026-03-11 21:27:32.100357
1419	7	128	2026-03-11 21:27:32.10498
1420	7	129	2026-03-11 21:27:32.108783
1421	7	130	2026-03-11 21:27:32.11267
1422	7	131	2026-03-11 21:27:32.116208
1423	7	132	2026-03-11 21:27:32.121175
1424	7	133	2026-03-11 21:27:32.126743
1425	7	134	2026-03-11 21:27:32.130342
1426	7	135	2026-03-11 21:27:32.134059
1427	7	137	2026-03-11 21:27:32.138164
1428	7	143	2026-03-11 21:27:32.14183
1429	7	144	2026-03-11 21:27:32.145431
1430	7	145	2026-03-11 21:27:32.149672
1431	7	146	2026-03-11 21:27:32.153673
1432	7	147	2026-03-11 21:27:32.157289
1433	7	148	2026-03-11 21:27:32.160865
1434	7	149	2026-03-11 21:27:32.164545
1435	7	150	2026-03-11 21:27:32.168683
1436	7	151	2026-03-11 21:27:32.172315
1437	7	152	2026-03-11 21:27:32.175929
1438	7	154	2026-03-11 21:27:32.179544
1439	7	156	2026-03-11 21:27:32.184507
1440	7	157	2026-03-11 21:27:32.18829
1441	7	160	2026-03-11 21:27:32.192178
1442	7	162	2026-03-11 21:27:32.195856
1443	7	163	2026-03-11 21:27:32.200211
1444	7	164	2026-03-11 21:27:32.203775
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, created_at, updated_at) FROM stdin;
1	admin	Full system access with all permissions	2025-07-16 15:26:19.120802	2025-07-16 15:26:19.120802
2	manager	Management access with most permissions	2025-07-16 15:26:19.219014	2025-07-16 15:26:19.219014
3	technician	Technician access for work orders and tasks	2025-07-16 15:26:19.471324	2025-07-16 15:26:19.471324
4	viewer	Read-only access to view data	2025-07-16 15:26:19.571663	2025-07-16 15:26:19.571663
5	Project Coordinator		2025-08-27 17:37:36.624296	2025-08-27 17:37:36.624296
6	logistics	Logistics management - handles parts, dispatch, and supply chain operations	2026-03-11 21:27:31.861705	2026-03-11 21:27:31.861705
7	finance_officer	Finance Officer - manages payments, invoices, and financial reporting	2026-03-11 21:27:32.022353	2026-03-11 21:27:32.022353
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (id, team_id, technician_id, joined_at) FROM stdin;
1	1	5	2026-03-11 21:46:15.807826
2	1	1	2026-03-11 21:46:21.69903
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, description, team_lead_id, is_active, created_at) FROM stdin;
1	Test Team Alpha	Test description	\N	t	2026-03-11 21:28:53.169589
2	Alpha Team	\N	\N	t	2026-03-11 21:32:47.107026
3	HVAC Team	\N	\N	t	2026-03-11 21:37:51.772479
\.


--
-- Data for Name: technician_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.technician_ratings (id, technician_id, work_order_id, rating, comment, rated_by, created_at) FROM stdin;
\.


--
-- Data for Name: technicians; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.technicians (id, first_name, last_name, email, phone, specialization, experience, hourly_rate, availability, location, latitude, longitude, payment_methods, bank_account, routing_number, bank_name, paypal_email, venmo_handle, cashapp_handle, zelle_info, mailing_address, average_rating, total_ratings, is_active, created_at, updated_at, w9_status, w9_file_path, w9_file_name, w9_submitted_at) FROM stdin;
2	Sarah	Johnson	sarah.johnson@example.com	+1-555-0102	Electrical	3	65.00	available	Uptown	40.7831000	-73.9712000	bank_transfer,paypal,venmo		\N	\N						4.80	8	t	2025-07-16 15:26:23.417976	2025-07-16 15:26:23.417976	not_submitted	\N	\N	\N
4	carlos	lopez	Carlos.lopez@unitedvendorsgroup.com	(929) 636-5698	HVAC	5	70.00	available	506 74th st, brooklyn ny 11209	40.6282000	-74.0776000	credit_card	https://connect.intuit.com/t/scs-v1-371bdc350c62497e99bc4c1ec22d4e63b7f75cb3d05a4058a40a60dcca33726237d04f5690a84a7f92191d0f72227bfe?cta=viewinvoicenow&locale=en_US&grw=ltr_t1	\N	\N						0.00	0	t	2025-08-05 18:35:29.124347	2025-08-05 18:35:29.124347	not_submitted	\N	\N	\N
5	Jason	 test	Jason.AB@gmail.com	4012222255	Handyman	2	75.00	available	7901 4TH N St petersburg FL 33702	27.8443962	-82.6382350	venmo		\N	\N		Jason				0.00	0	t	2025-08-27 15:47:40.47018	2025-08-27 15:47:40.47018	not_submitted	\N	\N	\N
1	John	Smith	john.smith@example.com	+1-555-0101	HVAC	5	75.00	available	Downtown	40.7128000	-74.0060000	bank_transfer,check	610729813	\N	\N						4.50	12	t	2025-07-16 15:26:23.417976	2025-07-16 15:26:23.417976	submitted	/home/runner/workspace/uploads/w9/w9-1-1773929283789-708323846.jpg	fbLogo3.jpg	2026-03-19 14:08:03.844
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role_id, assigned_at) FROM stdin;
1	1	1	2025-07-16 15:26:23.092291
2	2	2	2025-07-16 15:26:23.092291
3	3	4	2025-07-16 15:26:23.092291
7	7	3	2025-07-30 22:46:57.16309
10	10	3	2025-08-04 01:27:35.718913
13	15	1	2025-08-27 17:53:40.970067
17	18	3	2026-02-12 22:27:38.904035
18	19	5	2026-03-10 18:25:40.86246
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, first_name, last_name, is_active, created_at, updated_at, team_id) FROM stdin;
3	viewer	viewer@example.com	$2b$10$h96IBUcBQ990vL/JgkTsg.TfYolKW2nr8c2LBV/57JUAAkOXfowbS	Viewer	User	t	2025-07-16 15:26:23.032966	2025-07-16 15:26:23.032966	\N
10	Jason.tc	Jason.tc@gmail.com	$2b$10$S4Kdo/Luf93WbUrVwXtca.UqSWeGoMxUqekPf2ZRInWDNxxry/wwq	Jason	Tech	t	2025-08-04 01:27:35.664807	2025-08-04 01:27:35.664807	\N
1	admin	admin@example.com	$2b$10$QJN/fyiXpzT40shp1ZIEN.2jy6.3VLoi7amnvJdy/9fyKhcycAt8K	Admin	User	t	2025-07-16 15:26:22.385853	2025-07-16 15:26:22.385853	\N
2	manager	manager@example.com	$2b$10$H9zRujNcyKT96gMrvXVoIeuoi9624l76mX26c.crwdAr1UUQQ8iya	Manager	User	t	2025-07-16 15:26:22.911378	2025-07-16 15:26:22.911378	\N
7	tec	tc@gmailcom	$2b$10$zwEpo9KP1CbCg3nS7JCw5uXE6nCgBiMYdNAyKGofKZdWPj.Gi35O6	tec	tect	t	2025-07-30 22:46:57.094959	2025-07-30 22:46:57.094959	\N
12	PJ	Jason.AB@gmail.com	$2b$10$ODzShaDuIVT1TMboktUXq.902l47LXLlXl.gOU0p075Y9GtyON28W	P	J	t	2025-08-27 17:38:11.810417	2025-08-27 17:38:11.810417	\N
15	asd	admin22@gmail.com	$2b$10$NY.QuXUQOMBUavlkn2ad2ey52n7/GKMp1XC5CFj74OdcZtg5vmq.S	asd	asd	t	2025-08-27 17:53:40.917619	2025-08-27 17:53:40.917619	\N
17	eded	eded@gmail.com	$2b$10$p0Wv80Id5DnVifYIh3F42eCbICExRzuNx/uNGyKpo1c5Oudm1CVGi	Ed	es	t	2025-12-10 21:13:10.799172	2025-12-10 21:13:10.799172	\N
18	123	123@gmail.com	$2b$10$/3CrLvCch.OxLiuykbN5Ye66kJUw/jgo7Ic.tOb7T.hlD0dusfxm.	1234	5678	t	2026-02-12 22:27:04.399565	2026-02-12 22:27:04.399565	\N
19	WissamYSS	Wissamyoussef173@gmail.com	$2b$10$.X6Thkm81JDBZqtl6fv48e6fi4VP9FJ11dlMCo5bHdrp74ZePqfyG	Wissam 	Youssef	t	2026-03-10 18:25:40.761978	2026-03-10 18:25:40.761978	\N
\.


--
-- Data for Name: work_order_chats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_chats (id, work_order_id, user_id, message, file_url, message_type, created_at, sender_id) FROM stdin;
1	7	1	eeee	\N	text	2025-07-24 19:45:33.003268	1
2	6	1	hello	\N	text	2025-08-04 01:21:40.423431	1
3	16	1	Hello	\N	text	2025-12-11 00:38:38.933488	1
4	17	1	hello	\N	text	2026-02-13 14:32:32.758765	1
\.


--
-- Data for Name: work_order_client_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_client_payments (id, work_order_id, payment_type, amount, payment_method, status, reference_number, notes, received_at, created_at) FROM stdin;
1	8	full	444.00	ach	pending	222	3333	\N	2026-03-19 14:08:59.283918
2	8	full	250.00	check	pending			\N	2026-03-19 14:11:29.159363
3	17	full	500.00	check	pending	CHK-001	Automated test payment	\N	2026-03-19 15:11:39.626813
4	17	full	250.00	check	confirmed	CHK-TEST-01		2026-03-19 15:15:57.526	2026-03-19 15:15:49.846429
\.


--
-- Data for Name: work_order_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_files (id, work_order_id, file_name, file_path, file_size, mime_type, category, uploaded_by, created_at) FROM stdin;
4	7	image003.png	/uploads/7/1753386223959-789424275.png	28224	image/png	before	1	2025-07-24 19:43:43.996272
5	6	OIP.jpeg	/uploads/6/1754268952494-576707311.jpeg	3966	image/jpeg	before	1	2025-08-04 00:55:52.529159
6	10	thumbnail_Outlook-signatureI.png	/uploads/10/1754420009377-997925727.png	110984	image/png	document	1	2025-08-05 18:53:29.417096
7	10	download (15).jpg	/uploads/10/1754420030183-360257984.jpg	17814	image/jpeg	before	1	2025-08-05 18:53:50.219457
8	15	before (1).jpeg	/uploads/15/1765410865718-398061792.jpeg	128451	image/jpeg	before	1	2025-12-10 23:54:25.778397
9	15	before (6).jpeg	/uploads/15/1765410867524-367889193.jpeg	64720	image/jpeg	after	1	2025-12-10 23:54:27.578889
10	15	before (14).jpeg	/uploads/15/1765410871808-214022881.jpeg	233334	image/jpeg	signature	1	2025-12-10 23:54:31.865213
11	18	4c1272b4c359c983827a5c850bf8ecfd.jpg	/uploads/18/1773248486565-707496247.jpg	25447	image/jpeg	before	1	2026-03-11 17:01:26.75201
\.


--
-- Data for Name: work_order_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_invoices (id, work_order_id, invoice_number, labor_cost, material_cost, additional_costs, subtotal, tax_rate, tax_amount, total_amount, status, notes, created_at, sent_at, paid_at) FROM stdin;
14	7	INV-WO-2025-041-1753385575022	22.00	22.00	0.00	44.00	10.0000	4.40	48.40	paid	222	2025-07-24 19:32:55.055412	\N	\N
16	15	INV-WO-2025-121-1765411447185	345.00	1356.00	0.00	1701.00	10.0000	170.10	1871.10	paid		2025-12-11 00:04:07.238002	\N	\N
15	6	INV-WO-2025-031-1754272573437	200.00	100.00	0.00	300.00	10.0000	30.00	330.00	paid		2025-08-04 01:56:13.466226	\N	\N
\.


--
-- Data for Name: work_order_parts_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_parts_requests (id, work_order_id, part_name, part_number, quantity, estimated_cost, supplier, urgency, status, notes, requested_by, approved_by, created_at, approved_at) FROM stdin;
1	7	5555	5555	55	555.00	555	normal	approved	4444	1	\N	2025-07-24 19:38:30.763645	\N
2	6	jason door j	2202	1	200.00	amazon	normal	approved	Jason. 0000	1	\N	2025-08-04 01:51:24.144101	\N
3	6	444	\N	1	200.00	\N	normal	cancelled	https://www.amazon.com/Xbox-Wireless-Gaming-Controller-Headsets-Console/dp/B0F1HX3WXX/ref=sr_1_1?_encoding=UTF8&content-id=amzn1.sym.edf433e2-b6d4-408e-986d-75239a5ced10&dib=eyJ2IjoiMSJ9.CM0YOQwuGmC27Ik-fqZEaFJRnB6jaBtMI1Q8k59w4Il-iAJOa1pJDXQKwH_77WqciQLuB6fhKMqXiPIsrk17Lzh2felWxjTSoHDYFRw4c-Jip-6Noh63U-1aZo5DWQ2aHrkLjte46nUVayepkOvkBl1BbfccTKLTeQIDRTB1RSTA0fNdXIuCSUsn81Jvh6uVa2GbwGBnaVM8uhgWdealUkG3YoivaOJTl9EEnpFWtV0_ul5-3fAvsHjvSDIAb-LVmuvT3Ju8pulQUzC9IpvBTLrsgqFqOpG34N4brSLciPc.c1Nr8uD02PKzjj1otnhkFlU_AQR1qBh2LpFJP5X0sNk&dib_tag=se&keywords=gaming&pd_rd_r=2f6299b5-b68c-4707-8c00-66c3e15f0c7d&pd_rd_w=YTt1W&pd_rd_wg=hLqmE&qid=1754272345&sr=8-1.	1	\N	2025-08-04 01:53:00.831193	\N
4	12	464	4564564	4564	456.00	456	high	approved	546456. 56	1	\N	2025-08-05 18:30:56.975438	\N
5	3	car	1	1	10000.00	carhub	urgent	approved	djxndndixksnd didjdn. djdnene	1	\N	2025-12-10 17:53:00.672903	\N
7	15	Sink	\N	1	120.00	\N	normal	approved	\N	1	\N	2025-12-10 23:46:30.324296	\N
8	17	Light	123	5	25.00	amazon	urgent	approved	\N	1	\N	2026-02-13 14:22:56.71934	\N
9	19	rddrgf	gfdgdg	5	7.00	ftrt	low	pending	fgfdgdgd	1	\N	2026-03-19 17:44:02.083391	\N
6	14	door handle	64654	1	0.05	cdsff	low	approved	\N	17	\N	2025-12-10 21:18:30.207425	\N
\.


--
-- Data for Name: work_order_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_proposals (id, work_order_id, labor_cost, material_cost, additional_costs, total_cost, estimated_duration, description, status, labor_data, parts_data, services_data, message, created_at, approved_at, nte_cost, technician_cost, team_lead_approval, team_lead_id, team_lead_notes, team_lead_approved_at) FROM stdin;
1	7	0.00	0.00	0.00	0.00	TBD		pending	[{"transactionDate":"2025-07-24","payRate":"","regularHours":"","otHours":"","otScale":"1.5","remark":""},{"transactionDate":"2025-07-24","payRate":"","regularHours":"","otHours":"","otScale":"1.5","remark":""}]	[{"transactionDate":"2025-07-24","unitCost":"","quantity":"","remark":""}]	[{"transactionDate":"2025-07-24","transactionType":"","unitCost":"","quantity":"","remark":""}]		2025-07-24 20:00:28.706996	\N	0.00	0.00	pending	\N	\N	\N
2	4	0.00	0.00	0.00	0.00	TBD		approved	[{"transactionDate":"2025-07-29","payRate":"","regularHours":"","otHours":"","otScale":"1.5","remark":""}]	[{"transactionDate":"2025-07-29","unitCost":"","quantity":"","remark":""}]	[{"transactionDate":"2025-07-29","transactionType":"","unitCost":"","quantity":"","remark":""}]		2025-07-29 22:11:39.992153	\N	0.00	0.00	pending	\N	\N	\N
4	6	22.50	16.00	138.00	176.50	TBD		pending	[{"transactionDate":"2025-08-27","payRate":"3","regularHours":"3","otHours":"3","otScale":"1.5","remark":""}]	[{"transactionDate":"2025-08-27","unitCost":"4","quantity":"4","remark":"u6"}]	[{"transactionDate":"2025-08-27","transactionType":"6y5","unitCost":"23","quantity":"6","remark":""}]		2025-08-27 18:21:29.997338	\N	0.00	0.00	pending	\N	\N	\N
3	3	160.00	50.00	0.00	210.00	TBD		approved	[{"transactionDate":"2025-08-27","payRate":"80","regularHours":"2","otHours":"","otScale":"1.5","remark":""}]	[{"transactionDate":"2025-08-27","unitCost":"50","quantity":"1","remark":"jhjhj"}]	[{"transactionDate":"2025-08-27","transactionType":"","unitCost":"","quantity":"","remark":""}]		2025-08-27 17:55:01.39945	2025-08-27 18:21:56.579	0.00	0.00	pending	\N	\N	\N
5	14	400.00	400.00	0.00	800.00	TBD		approved	[{"transactionDate":"2025-12-10","payRate":"200","regularHours":"2","otHours":"","otScale":"1.5","remark":""}]	[{"transactionDate":"2025-12-10","unitCost":"200","quantity":"2","remark":"22222"}]	[{"transactionDate":"2025-12-10","transactionType":"","unitCost":"","quantity":"","remark":""}]		2025-12-10 21:20:31.725319	\N	0.00	0.00	pending	\N	\N	\N
6	15	1120.00	120.00	250.00	1490.00	TBD	Scope of work:..........................................................................	approved	[{"transactionDate":"2025-12-10","payRate":"80","regularHours":"8","otHours":"","otScale":"1.5","remark":""},{"transactionDate":"2025-12-10","payRate":"60","regularHours":"8","otHours":"","otScale":"1.5","remark":""}]	[{"transactionDate":"2025-12-10","unitCost":"120","quantity":"1","remark":""}]	[{"transactionDate":"2025-12-10","transactionType":"Snake fee","unitCost":"250","quantity":"1","remark":""}]	Scope of work:..........................................................................	2025-12-10 23:49:59.053109	\N	0.00	0.00	pending	\N	\N	\N
7	16	10.00	0.00	0.00	10.00	TBD		approved	[{"transactionDate":"2025-12-11","payRate":"2","regularHours":"2","otHours":"2","otScale":"1.5","remark":""}]	[{"transactionDate":"2025-12-11","unitCost":"","quantity":"","remark":""}]	[{"transactionDate":"2025-12-11","transactionType":"","unitCost":"","quantity":"","remark":""}]		2025-12-11 00:40:37.683897	2025-12-11 00:42:08.696	0.00	0.00	pending	\N	\N	\N
8	17	400.00	125.00	259.00	784.00	TBD	afafaef	approved	[{"transactionDate":"2026-02-13","payRate":"80","regularHours":"5","otHours":"","otScale":"1.5","remark":""}]	[{"transactionDate":"2026-02-13","unitCost":"25","quantity":"5","remark":""}]	[{"transactionDate":"2026-02-13","transactionType":"welding","unitCost":"259","quantity":"1","remark":""}]	afafaef	2026-02-13 14:27:16.812338	2026-02-13 14:28:10.872	0.00	0.00	pending	\N	\N	\N
9	18	700.00	1400.00	300.00	2400.00	TBD		pending	[{"transactionDate":"2026-03-10","payRate":"75","regularHours":"5","otHours":"","otScale":"1.5","remark":""},{"transactionDate":"2026-03-10","payRate":"65","regularHours":"5","otHours":"","otScale":"1.5","remark":""}]	[{"transactionDate":"2026-03-10","unitCost":"1400","quantity":"1","remark":""}]	[{"transactionDate":"2026-03-10","transactionType":"HVAC","unitCost":"150","quantity":"2","remark":""}]		2026-03-10 17:50:23.572711	\N	0.00	0.00	pending	\N	\N	\N
\.


--
-- Data for Name: work_order_technician_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_order_technician_payments (id, work_order_id, technician_id, payment_method, amount_requested, amount_approved, amount_paid, status, description, requested_at, approved_at, paid_at) FROM stdin;
3	5	1	["bank_transfer"]	1234.00	0.00	0.00	pending		2025-12-11 00:18:04.646931	\N	\N
7	17	2	["venmo"]	34.00	0.00	0.00	pending		2026-02-13 14:33:23.291118	\N	\N
8	3	2	["bank_transfer"]	122.72	0.00	0.00	pending		2026-02-22 10:59:57.100241	\N	\N
9	8	2	["bank_transfer"]	150.00	0.00	0.00	pending		2026-03-19 14:24:21.1219	\N	\N
1	3	1	["bank_transfer"]	22.00	22.00	22.00	paid		2025-08-05 23:00:48.478411	\N	\N
2	6	2	["bank_transfer"]	120.00	120.00	50.00	approved	dxmkdjawawfh	2025-12-11 00:14:58.981136	\N	\N
\.


--
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.work_orders (id, work_order_number, title, description, priority, status, category, location, requested_by, assigned_to, technician_id, client_name, client_phone, client_email, country, city, street, zip_code, nte, tnte, estimated_hours, actual_hours, scheduled_date, start_date, end_date, completed_date, urgency, equipment_type, problem_description, special_instructions, access_instructions, safety_requirements, assigned_user_ids, client_work_order_number, is_locked, created_at, updated_at, team_id, financial_status, total_payment, rejection_reason, rejected_at, is_fast_work_order) FROM stdin;
9	WO-2025-061	Emcor	lights	medium	active		rt, br, us	1	1	\N	Emcor	2002002000		us	br	rt	33702	100.00	150.00	1.5	\N	2025-08-04	2025-08-04	2025-08-06	\N	medium		dfdsfffsdf	call 			\N	2332123	f	2025-08-04 01:18:41.829424	2025-08-04 01:18:41.829424	\N	pending	\N	\N	\N	f
10	WO-2025-071	Emcor	Jason test	urgent	active		rt, br, us	1	10	\N	Emcor	40205050		us	br	rt	33702	200.00	500.00	\N	\N	2025-08-04	2025-08-04	2025-08-07	\N	urgent		Water heater 	Tech kzeb	lock code 11202	none	\N	402050	f	2025-08-04 01:30:25.562151	2025-08-04 01:30:25.562151	\N	pending	\N	\N	\N	f
11	WO-2025-081	cbre	njkjkjk	medium	active	hvac	12, Albany, United States	1	1	\N	cbre	14078070285		United States	Albany	12	12207	600.00	1000.00	24	\N	2025-08-12	2025-08-12	2025-08-13	\N	medium	hvac	hhj	mnjn	njnk	jhjn	\N		f	2025-08-04 01:43:21.3387	2025-08-04 01:43:21.3387	\N	pending	\N	\N	\N	f
12	WO-2025-091	dmg	wdw	medium	active	hvac	506 74th street, brooklyn, usa	1	10	\N	dmg	46545695		usa	brooklyn	506 74th street	11209	200.00	400.00	\N	\N	2025-08-05	2025-08-05	2025-08-06	\N	medium	hvac	wewe		wed	wew	\N	21212121	f	2025-08-05 16:25:23.890328	2025-08-05 16:25:23.890328	\N	pending	\N	\N	\N	f
13	WO-2025-101	cbre	dfgdfgdsfgsdfgsdfg	medium	active	installation	rt, br, us	1	7	\N	cbre	2002002000	john@techsolutions.com	us	br	rt	12207	200.00	300.00	\N	\N	2025-08-27	2025-08-27	2025-08-28	\N	medium	installation	dfgdfgdfg ggg gggg ggg 				\N	cbre	f	2025-08-27 15:55:45.989396	2025-08-27 15:55:45.989396	\N	pending	\N	\N	\N	f
5	WO-2025-003	Secure Buildings LLC	Upgrade security cameras and access control systems	high		upgrade	yuiyuiuy, hyuiyu, us	1	12	\N	Secure Buildings LLC	555-0789	mike@securebuildings.com	us	hyuiyu	yuiyuiuy		25000.00	30000.00	\N	\N	2025-08-27	2025-08-27	2025-08-28	\N	high	upgrade	Upgrade existing security infrastructure with new cameras and access controls	Security clearance required. Work must be completed during night hours.			\N		f	2025-07-16 15:46:55.361382	2025-07-16 15:46:55.361382	\N	pending	\N	\N	\N	f
14	WO-2025-111	Eds	sefsefsef	medium	active	sefseefsefsef	Miami, Miami, usa	1	17	\N	Eds			usa	Miami	Miami	33137 - 5013	200.00	300.00	2	\N	2025-12-10	2025-12-10	2025-12-11	\N	medium	sefseefsefsef	sefsef	sdfsdf	ssss	ssssss	\N	WO-112233	f	2025-12-10 21:15:19.598932	2025-12-10 21:15:19.598932	\N	pending	\N	\N	\N	f
21	WO-TEST-001	Test WO 001	Automated test work order	medium	pending	general	Test Location	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-11 21:29:35.261578	2026-03-11 21:29:35.261578	\N	pending	\N	\N	\N	f
3	WO-2025-001	Office Network Installation	Install and configure network infrastructure for new office building	high	pending	installation	123 Business Park, New York	1	\N	\N	Tech Solutions Inc	555-0123	john@techsolutions.com	\N	\N	\N	\N	15000.00	18000.00	\N	\N	\N	\N	\N	\N	\N	\N	Network infrastructure needed for new office space with 50 workstations	Access requires security badge. Work hours: 8 AM - 6 PM only.	\N	\N	\N	\N	f	2025-07-16 15:46:55.361382	2025-07-16 15:46:55.361382	\N	invoiced	\N	\N	\N	f
15	WO-2025-121	Majestic	SERVICE LOCATION\nFlying J - Loc # 554\n4066 US-59\nGeorge West, TX 78022\nPhone # 361-449-142\n\nSERVICE DESCRIPTION\nWork Summary: The store is reporting that when power wash sink is on it leaks water. Please inspect, take photos\nand repair as needed, IF within the NTE given. Or estimate repair as needed if costs exceed NTE. Thank you.\n	medium	active	Plumbing	4066 US-59, George West, TX, USA	1	3	\N	Majestic			USA	George West, TX	4066 US-59	78022	120.00	120.00	\N	\N	2025-12-10	2025-12-10	2025-12-12	\N	medium	Plumbing	SERVICE DESCRIPTION\nWork Summary: The store is reporting that when power wash sink is on it leaks water. Please inspect, take photos\nand repair as needed, IF within the NTE given. Or estimate repair as needed if costs exceed NTE. Thank you.\n	Check in and check out			\N	53565-01	t	2025-12-10 23:44:15.291332	2025-12-10 23:44:15.291332	\N	paid	\N	\N	\N	f
8	WO-2025-051	222	2222	medium	rejected		22, 22, 22	1	7	\N	222	222	ww.@gmail.com	22	22	22	2222	2222.00	222.00	\N	\N	2025-07-30	2025-07-30	2025-08-07	\N	medium						[7]	\N	t	2025-07-30 22:51:17.002348	2025-07-30 22:51:17.002348	\N	pending	\N	Client cancelled the project - budget was not approved for Q1	2026-03-19 14:43:39.304	f
4	WO-2025-002	HVAC System Repair	Repair and maintenance of HVAC system in warehouse facility	medium	in_progress	repair	456 Industrial Ave, Chicago	1	\N	\N	Warehouse Corp	555-0456	sarah@warehouse.com	\N	\N	\N	\N	8500.00	10000.00	\N	\N	\N	\N	\N	\N	\N	\N	HVAC system not maintaining proper temperature in warehouse	Equipment access through loading dock. Contact facility manager on arrival.	\N	\N	\N	\N	f	2025-07-16 15:46:55.361382	2025-07-16 15:46:55.361382	\N	paid	\N	\N	\N	f
16	WO-2025-131	WO-111-222	Testing payment 	medium	active		123123, Maimi test, USA	1	17	\N	WO-111-222			USA	Maimi test	123123	12345	120.00	120.00	\N	\N	2025-12-11	2025-12-11	2025-12-12	\N	medium						\N		f	2025-12-11 00:36:53.375181	2025-12-11 00:36:53.375181	\N	pending	\N	\N	\N	t
7	WO-2025-041	222	222	medium	active	22	qqq, qq, qq	1	1	\N	222			qq	qq	qqq	qqq	1.00	1.00	2	\N	2025-07-25	2025-07-25	2025-07-30	\N	medium	22					[1,7]	\N	t	2025-07-24 19:32:40.775782	2025-07-24 19:32:40.775782	\N	invoiced	\N	\N	\N	f
6	WO-2025-031	ABC Corporation	www	high	active	222	TTT, YY, Lebanon	1	1	\N	ABC Corporation	ww	ww.@gmail.com	Lebanon	YY	TTT	0000	22.00	22.00	\N	\N	2025-07-16	2025-07-16	2025-07-29	\N	high	222	www			w	[1,2,3]	\N	t	2025-07-16 15:49:15.488591	2025-07-16 15:49:15.488591	\N	invoiced	\N	\N	\N	f
17	WO-2026-141	Oreilley	006353 - I20 - INDIANAPOLIS - IN\n1192 N ARLINGTON AVE\n-\nINDIANAPOLIS IN 46219	medium	active		Arlington ave, Indianapolis, USA	1	18	\N	Oreilley			USA	Indianapolis	Arlington ave	4256	300.00	300.00	\N	\N	2026-02-05	2026-02-05	2026-02-18	\N	medium		Problem Description: Please review attached Source One photometric and materials list, and assess existing lighting conditions. Quote to install two new poles and replace all existing exterior lighting with O'Reilly supplied materials.	Client will provide parts			\N	335390265	f	2026-02-12 22:43:28.345441	2026-02-12 22:43:28.345441	\N	invoiced	\N	\N	\N	f
18	WO-2026-151	Daniel	0	medium	active		Puy, WA, Usa	1	19	\N	Daniel			Usa	WA	Puy	14058	0.05	0.04	\N	\N	2026-03-10	2026-03-10	2026-04-11	\N	medium						\N	12345	f	2026-03-10 17:44:44.58422	2026-03-10 17:44:44.58422	\N	paid	\N	\N	\N	t
19	WO-2026-161	Tricon	Property Address: 402 22Nd Avenue Court SW, Puyallup, WA, 98371\nWork Order ID: 586909\nPrimary Resident Name: Christopher Soule\nResident Mobile: (253) 213-6426\nResident Email: soule.c@yahoo.com\n\nBrief WorkOrder Details:\n\nRoom: Bath 2\nPriority: Emergency\nCategory: Plumbing\nNotes: active leak unable to stop without shutting main. Resident not aware where main is to close. NTE- Please complete work up to $400 Please provide photos with every BID, and a complete cost breakdown. Pls contact resident ASAP. Thank you *For onsite approval, please reach out to Joshua Smith :jsmith@triconresidential.com T: 602 483 1474 ***	urgent	active	Plumbing	402 22Nd Avenue Court SW,, Puyallup, USA	1	19	\N	Tricon			USA	Puyallup	402 22Nd Avenue Court SW,	98371	0.00	0.00	\N	\N	2026-03-10	2026-03-10	2026-04-11	\N	urgent	Plumbing					\N	586909	f	2026-03-10 18:35:31.610812	2026-03-10 18:35:31.610812	\N	pending	\N	\N	\N	t
\.


--
-- Name: job_inspections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_inspections_id_seq', 1, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 181, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 1444, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_members_id_seq', 2, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teams_id_seq', 3, true);


--
-- Name: technician_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.technician_ratings_id_seq', 1, false);


--
-- Name: technicians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.technicians_id_seq', 6, true);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 18, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 19, true);


--
-- Name: work_order_chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_chats_id_seq', 4, true);


--
-- Name: work_order_client_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_client_payments_id_seq', 4, true);


--
-- Name: work_order_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_files_id_seq', 12, true);


--
-- Name: work_order_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_invoices_id_seq', 16, true);


--
-- Name: work_order_parts_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_parts_requests_id_seq', 9, true);


--
-- Name: work_order_proposals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_proposals_id_seq', 9, true);


--
-- Name: work_order_technician_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_order_technician_payments_id_seq', 9, true);


--
-- Name: work_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.work_orders_id_seq', 21, true);


--
-- Name: job_inspections job_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_inspections
    ADD CONSTRAINT job_inspections_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_unique UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: technician_ratings technician_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technician_ratings
    ADD CONSTRAINT technician_ratings_pkey PRIMARY KEY (id);


--
-- Name: technicians technicians_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_email_unique UNIQUE (email);


--
-- Name: technicians technicians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: work_order_chats work_order_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_chats
    ADD CONSTRAINT work_order_chats_pkey PRIMARY KEY (id);


--
-- Name: work_order_client_payments work_order_client_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_client_payments
    ADD CONSTRAINT work_order_client_payments_pkey PRIMARY KEY (id);


--
-- Name: work_order_files work_order_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_files
    ADD CONSTRAINT work_order_files_pkey PRIMARY KEY (id);


--
-- Name: work_order_invoices work_order_invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_invoices
    ADD CONSTRAINT work_order_invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: work_order_invoices work_order_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_invoices
    ADD CONSTRAINT work_order_invoices_pkey PRIMARY KEY (id);


--
-- Name: work_order_parts_requests work_order_parts_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_requests
    ADD CONSTRAINT work_order_parts_requests_pkey PRIMARY KEY (id);


--
-- Name: work_order_proposals work_order_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_proposals
    ADD CONSTRAINT work_order_proposals_pkey PRIMARY KEY (id);


--
-- Name: work_order_technician_payments work_order_technician_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_technician_payments
    ADD CONSTRAINT work_order_technician_payments_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_work_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_work_order_number_unique UNIQUE (work_order_number);


--
-- Name: job_inspections job_inspections_submitted_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_inspections
    ADD CONSTRAINT job_inspections_submitted_by_users_id_fk FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: job_inspections job_inspections_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_inspections
    ADD CONSTRAINT job_inspections_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_permissions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_technician_id_technicians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_technician_id_technicians_id_fk FOREIGN KEY (technician_id) REFERENCES public.technicians(id) ON DELETE CASCADE;


--
-- Name: teams teams_team_lead_id_technicians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_team_lead_id_technicians_id_fk FOREIGN KEY (team_lead_id) REFERENCES public.technicians(id) ON DELETE SET NULL;


--
-- Name: technician_ratings technician_ratings_technician_id_technicians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technician_ratings
    ADD CONSTRAINT technician_ratings_technician_id_technicians_id_fk FOREIGN KEY (technician_id) REFERENCES public.technicians(id) ON DELETE CASCADE;


--
-- Name: technician_ratings technician_ratings_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technician_ratings
    ADD CONSTRAINT technician_ratings_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: work_order_chats work_order_chats_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_chats
    ADD CONSTRAINT work_order_chats_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: work_order_chats work_order_chats_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_chats
    ADD CONSTRAINT work_order_chats_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: work_order_chats work_order_chats_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_chats
    ADD CONSTRAINT work_order_chats_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_client_payments work_order_client_payments_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_client_payments
    ADD CONSTRAINT work_order_client_payments_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_files work_order_files_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_files
    ADD CONSTRAINT work_order_files_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: work_order_files work_order_files_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_files
    ADD CONSTRAINT work_order_files_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_invoices work_order_invoices_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_invoices
    ADD CONSTRAINT work_order_invoices_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_parts_requests work_order_parts_requests_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_requests
    ADD CONSTRAINT work_order_parts_requests_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: work_order_parts_requests work_order_parts_requests_requested_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_requests
    ADD CONSTRAINT work_order_parts_requests_requested_by_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: work_order_parts_requests work_order_parts_requests_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_parts_requests
    ADD CONSTRAINT work_order_parts_requests_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_proposals work_order_proposals_team_lead_id_technicians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_proposals
    ADD CONSTRAINT work_order_proposals_team_lead_id_technicians_id_fk FOREIGN KEY (team_lead_id) REFERENCES public.technicians(id) ON DELETE SET NULL;


--
-- Name: work_order_proposals work_order_proposals_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_proposals
    ADD CONSTRAINT work_order_proposals_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_order_technician_payments work_order_technician_payments_technician_id_technicians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_technician_payments
    ADD CONSTRAINT work_order_technician_payments_technician_id_technicians_id_fk FOREIGN KEY (technician_id) REFERENCES public.technicians(id) ON DELETE CASCADE;


--
-- Name: work_order_technician_payments work_order_technician_payments_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_technician_payments
    ADD CONSTRAINT work_order_technician_payments_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_orders work_orders_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: work_orders work_orders_requested_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_requested_by_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: work_orders work_orders_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: work_orders work_orders_technician_id_technicians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_technician_id_technicians_id_fk FOREIGN KEY (technician_id) REFERENCES public.technicians(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 8c0oNEFP3zk5qhuuZg3vbx5PbBoik3hD2dfNtiiEYfmYrqJOLW9118035cAnA3F

