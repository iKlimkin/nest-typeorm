--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: quiz_answer_answerstatus_enum; Type: TYPE; Schema: public; Owner: NodeJS
--

CREATE TYPE public.quiz_answer_answerstatus_enum AS ENUM (
    'Correct',
    'Incorrect'
);


ALTER TYPE public.quiz_answer_answerstatus_enum OWNER TO "NodeJS";

--
-- Name: truncate_tables(character varying); Type: FUNCTION; Schema: public; Owner: NodeJS
--

CREATE FUNCTION public.truncate_tables(username character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
            DECLARE
                statements CURSOR FOR
                    SELECT tablename FROM pg_tables
                    WHERE tableowner = username AND schemaname = 'public';
            BEGIN
                FOR stmt IN statements LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
                END LOOP;
            END;
            $$;


ALTER FUNCTION public.truncate_tables(username character varying) OWNER TO "NodeJS";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_requests; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.api_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ip character varying NOT NULL,
    url character varying NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_requests OWNER TO "NodeJS";

--
-- Name: blog; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.blog (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    title character varying NOT NULL,
    description character varying NOT NULL,
    websiteUrl character varying NOT NULL,
    is_membership boolean NOT NULL,
    "userId" uuid
);


ALTER TABLE public.blog OWNER TO "NodeJS";

--
-- Name: comment; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.comment (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    content character varying NOT NULL,
    post_id uuid,
    user_id uuid,
    "userLogin" character varying NOT NULL
);


ALTER TABLE public.comment OWNER TO "NodeJS";

--
-- Name: comment_reaction; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.comment_reaction (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    reactionType character varying NOT NULL,
    comment_id uuid,
    user_id uuid
);


ALTER TABLE public.comment_reaction OWNER TO "NodeJS";

--
-- Name: comment_reaction_counts; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.comment_reaction_counts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    likes_count integer NOT NULL,
    dislikes_count integer NOT NULL,
    comment_id uuid
);


ALTER TABLE public.comment_reaction_counts OWNER TO "NodeJS";

--
-- Name: current_game_question; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.current_game_question (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    "order" smallint NOT NULL,
    "quizPairId" uuid,
    "questionId" uuid NOT NULL
);


ALTER TABLE public.current_game_question OWNER TO "NodeJS";

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO "NodeJS";

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: NodeJS
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO "NodeJS";

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: NodeJS
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: player_progress; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.player_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    login character varying NOT NULL,
    "playerId" uuid NOT NULL,
    score smallint DEFAULT '0'::smallint NOT NULL,
    "answersCount" smallint DEFAULT '0'::smallint NOT NULL,
    "questCompletionDate" timestamp without time zone
);


ALTER TABLE public.player_progress OWNER TO "NodeJS";

--
-- Name: post; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.post (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    title character varying NOT NULL,
    short_description character varying NOT NULL,
    blog_title character varying NOT NULL,
    content character varying NOT NULL,
    "userId" uuid,
    "blogId" character varying NOT NULL
);


ALTER TABLE public.post OWNER TO "NodeJS";

--
-- Name: post_reaction; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.post_reaction (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    reactionType character varying NOT NULL,
    userLogin character varying NOT NULL,
    post_id uuid,
    user_id uuid
);


ALTER TABLE public.post_reaction OWNER TO "NodeJS";

--
-- Name: post_reaction_counts; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.post_reaction_counts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    likes_count integer NOT NULL,
    dislikes_count integer NOT NULL,
    post_id uuid
);


ALTER TABLE public.post_reaction_counts OWNER TO "NodeJS";

--
-- Name: quiz_answer; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.quiz_answer (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    "answerText" character varying,
    "answerStatus" public.quiz_answer_answerstatus_enum NOT NULL,
    "playerProgressId" uuid,
    "questionId" character varying NOT NULL
);


ALTER TABLE public.quiz_answer OWNER TO "NodeJS";

--
-- Name: quiz_correct_answer; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.quiz_correct_answer (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    "answerText" character varying NOT NULL,
    "questionId" uuid
);


ALTER TABLE public.quiz_correct_answer OWNER TO "NodeJS";

--
-- Name: quiz_game; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.quiz_game (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    status character varying NOT NULL,
    "startGameDate" timestamp without time zone,
    "finishGameDate" timestamp without time zone,
    version integer DEFAULT 1 NOT NULL,
    "firstPlayerId" character varying NOT NULL,
    "secondPlayerId" character varying,
    "firstPlayerProgressId" uuid,
    "secondPlayerProgressId" uuid,
    "winnerId" character varying
);


ALTER TABLE public.quiz_game OWNER TO "NodeJS";

--
-- Name: quiz_player_progress; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.quiz_player_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    login character varying NOT NULL,
    score smallint DEFAULT '0'::smallint NOT NULL,
    "answersCount" smallint DEFAULT '0'::smallint NOT NULL,
    "questCompletionDate" timestamp without time zone,
    "playerId" uuid NOT NULL
);


ALTER TABLE public.quiz_player_progress OWNER TO "NodeJS";

--
-- Name: quiz_question; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.quiz_question (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    body character varying NOT NULL,
    published boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.quiz_question OWNER TO "NodeJS";

--
-- Name: temporary_user_account; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.temporary_user_account (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    email character varying NOT NULL,
    recovery_code character varying NOT NULL,
    code_expiration_time timestamp without time zone NOT NULL
);


ALTER TABLE public.temporary_user_account OWNER TO "NodeJS";

--
-- Name: user_account; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.user_account (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    login character varying NOT NULL,
    email character varying NOT NULL,
    password_salt character varying NOT NULL,
    password_hash character varying NOT NULL,
    confirmation_code character varying NOT NULL,
    confirmation_expiration_date timestamp without time zone NOT NULL,
    is_confirmed boolean NOT NULL,
    password_recovery_code character varying,
    password_recovery_expiration_date timestamp without time zone
);


ALTER TABLE public.user_account OWNER TO "NodeJS";

--
-- Name: user_session; Type: TABLE; Schema: public; Owner: NodeJS
--

CREATE TABLE public.user_session (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    ip character varying NOT NULL,
    user_agent_info character varying NOT NULL,
    device_id character varying NOT NULL,
    refresh_token character varying NOT NULL,
    rt_issued_at timestamp without time zone NOT NULL,
    rt_expiration_date timestamp without time zone NOT NULL,
    user_id uuid
);


ALTER TABLE public.user_session OWNER TO "NodeJS";

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: api_requests; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.api_requests (id, ip, url, "timestamp") FROM stdin;
\.


--
-- Data for Name: blog; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.blog (id, created_at, title, description, websiteUrl, is_membership, "userId") FROM stdin;
\.


--
-- Data for Name: comment; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.comment (id, created_at, content, post_id, user_id, "userLogin") FROM stdin;
\.


--
-- Data for Name: comment_reaction; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.comment_reaction (id, created_at, reactionType, comment_id, user_id) FROM stdin;
\.


--
-- Data for Name: comment_reaction_counts; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.comment_reaction_counts (id, created_at, likes_count, dislikes_count, comment_id) FROM stdin;
\.


--
-- Data for Name: current_game_question; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.current_game_question (id, created_at, "order", "quizPairId", "questionId") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
\.


--
-- Data for Name: player_progress; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.player_progress (id, created_at, login, "playerId", score, "answersCount", "questCompletionDate") FROM stdin;
\.


--
-- Data for Name: post; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.post (id, created_at, title, short_description, blog_title, content, "userId", "blogId") FROM stdin;
\.


--
-- Data for Name: post_reaction; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.post_reaction (id, created_at, reactionType, userLogin, post_id, user_id) FROM stdin;
\.


--
-- Data for Name: post_reaction_counts; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.post_reaction_counts (id, created_at, likes_count, dislikes_count, post_id) FROM stdin;
\.


--
-- Data for Name: quiz_answer; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.quiz_answer (id, created_at, "answerText", "answerStatus", "playerProgressId", "questionId") FROM stdin;
\.


--
-- Data for Name: quiz_correct_answer; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.quiz_correct_answer (id, created_at, "answerText", "questionId") FROM stdin;
\.


--
-- Data for Name: quiz_game; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.quiz_game (id, created_at, status, "startGameDate", "finishGameDate", version, "firstPlayerId", "secondPlayerId", "firstPlayerProgressId", "secondPlayerProgressId", "winnerId") FROM stdin;
9f0c6720-4f5f-482c-9843-f860e5bf7cfd	2024-07-01 21:53:48.531123	PendingSecondPlayer	\N	\N	1	5f743bc5-90f8-49de-ae0a-689eb7342c23	\N	219394b2-22a2-497b-8b88-4d4083a5c55e	\N	\N
\.


--
-- Data for Name: quiz_player_progress; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.quiz_player_progress (id, created_at, login, score, "answersCount", "questCompletionDate", "playerId") FROM stdin;
219394b2-22a2-497b-8b88-4d4083a5c55e	2024-07-01 21:53:48.531123	login	0	0	\N	5f743bc5-90f8-49de-ae0a-689eb7342c23
\.


--
-- Data for Name: quiz_question; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.quiz_question (id, created_at, body, published, updated_at) FROM stdin;
\.


--
-- Data for Name: temporary_user_account; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.temporary_user_account (id, created_at, email, recovery_code, code_expiration_time) FROM stdin;
\.


--
-- Data for Name: user_account; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.user_account (id, created_at, login, email, password_salt, password_hash, confirmation_code, confirmation_expiration_date, is_confirmed, password_recovery_code, password_recovery_expiration_date) FROM stdin;
0e9644f1-7d55-42d5-b00b-3cc829f3881a	2024-07-01 21:52:52.882225	login1	email@yandex.ru	$2b$10$FN3esqiceYgxO0z0Be6U1.	$2b$10$FN3esqiceYgxO0z0Be6U1.PScGilmKV3OBloLr.U8Uv5TIjV7D8dm	b0be5766-2c2a-4465-87ee-82a2ef1b2d98	2024-07-01 23:07:52.878	f	\N	\N
5f743bc5-90f8-49de-ae0a-689eb7342c23	2024-07-01 21:53:35.092974	login	email@yandex.ru	$2b$10$150K4Mfn5ypdPm2AEiEVxe	$2b$10$150K4Mfn5ypdPm2AEiEVxeCJ6HAi7A6o6zecY.0IoIuOJ833IHwYG	5473ef7c-38ca-4a1a-852f-df128767a271	2024-07-01 23:08:35.038	f	\N	\N
\.


--
-- Data for Name: user_session; Type: TABLE DATA; Schema: public; Owner: NodeJS
--

COPY public.user_session (id, created_at, ip, user_agent_info, device_id, refresh_token, rt_issued_at, rt_expiration_date, user_id) FROM stdin;
1bfd7dad-57f1-4681-aefc-aeda57758275	2024-07-01 21:53:39.398182	::1	Device type: Unknown, Application: Unknown	2393ba0b-2700-4750-bced-4a21f85725b0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1Zjc0M2JjNS05MGY4LTQ5ZGUtYWUwYS02ODllYjczNDJjMjMiLCJkZXZpY2VJZCI6IjIzOTNiYTBiLTI3MDAtNDc1MC1iY2VkLTRhMjFmODU3MjViMCIsImlhdCI6MTcxOTg2MDAxOSwiZXhwIjoxNzE5OTMyMDE5fQ._hkzp-1-dJ5fnjG2PqYoXRk5ZxEtf-eU5OlRNUqTiAo	2024-07-01 21:53:39	2024-07-02 17:53:39	5f743bc5-90f8-49de-ae0a-689eb7342c23
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: NodeJS
--

SELECT pg_catalog.setval('public.migrations_id_seq', 6, true);


--
-- Name: comment PK_0b0e4bbc8415ec426f87f3a88e2; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY (id);


--
-- Name: quiz_question PK_0bab74c2a71b9b3f8a941104083; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_question
    ADD CONSTRAINT "PK_0bab74c2a71b9b3f8a941104083" PRIMARY KEY (id);


--
-- Name: comment_reaction_counts PK_25e8c34541c9595b789cd52f582; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment_reaction_counts
    ADD CONSTRAINT "PK_25e8c34541c9595b789cd52f582" PRIMARY KEY (id);


--
-- Name: post_reaction_counts PK_56358cc6f21b774700c809454fa; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post_reaction_counts
    ADD CONSTRAINT "PK_56358cc6f21b774700c809454fa" PRIMARY KEY (id);


--
-- Name: quiz_correct_answer PK_6579c39832e744ddaddd25d1911; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_correct_answer
    ADD CONSTRAINT "PK_6579c39832e744ddaddd25d1911" PRIMARY KEY (id);


--
-- Name: user_account PK_6acfec7285fdf9f463462de3e9f; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT "PK_6acfec7285fdf9f463462de3e9f" PRIMARY KEY (id);


--
-- Name: post_reaction PK_72c5fe23f6a0f35b8c2ba78945f; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post_reaction
    ADD CONSTRAINT "PK_72c5fe23f6a0f35b8c2ba78945f" PRIMARY KEY (id);


--
-- Name: temporary_user_account PK_7f654c86f63b83344619ec94bc7; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.temporary_user_account
    ADD CONSTRAINT "PK_7f654c86f63b83344619ec94bc7" PRIMARY KEY (id);


--
-- Name: blog PK_85c6532ad065a448e9de7638571; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "PK_85c6532ad065a448e9de7638571" PRIMARY KEY (id);


--
-- Name: comment_reaction PK_87f27d282c06eb61b1e0cde2d24; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT "PK_87f27d282c06eb61b1e0cde2d24" PRIMARY KEY (id);


--
-- Name: player_progress PK_8a99208b9d03cf5c1fbf9a391b2; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.player_progress
    ADD CONSTRAINT "PK_8a99208b9d03cf5c1fbf9a391b2" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: quiz_answer PK_926d49bc4559c8200b6c6c2c22f; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_answer
    ADD CONSTRAINT "PK_926d49bc4559c8200b6c6c2c22f" PRIMARY KEY (id);


--
-- Name: user_session PK_adf3b49590842ac3cf54cac451a; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT "PK_adf3b49590842ac3cf54cac451a" PRIMARY KEY (id);


--
-- Name: quiz_player_progress PK_b27d8d360ecc5d1a31289782625; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_player_progress
    ADD CONSTRAINT "PK_b27d8d360ecc5d1a31289782625" PRIMARY KEY (id);


--
-- Name: current_game_question PK_b722eae234a42ab570180984c4a; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.current_game_question
    ADD CONSTRAINT "PK_b722eae234a42ab570180984c4a" PRIMARY KEY (id);


--
-- Name: post PK_be5fda3aac270b134ff9c21cdee; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY (id);


--
-- Name: api_requests PK_c501a5bd89c34d626ba15d37ded; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.api_requests
    ADD CONSTRAINT "PK_c501a5bd89c34d626ba15d37ded" PRIMARY KEY (id);


--
-- Name: quiz_game PK_dd15fda9924eaca7bf9159b766b; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_game
    ADD CONSTRAINT "PK_dd15fda9924eaca7bf9159b766b" PRIMARY KEY (id);


--
-- Name: player_progress REL_f45661d3ff9342cf36a17c3d59; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.player_progress
    ADD CONSTRAINT "REL_f45661d3ff9342cf36a17c3d59" UNIQUE ("playerId");


--
-- Name: quiz_game UQ_2185540f9c25e501a66f8c8da05; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_game
    ADD CONSTRAINT "UQ_2185540f9c25e501a66f8c8da05" UNIQUE ("firstPlayerProgressId");


--
-- Name: quiz_game UQ_4b476e6c9aa02c26b2e31cbde9f; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_game
    ADD CONSTRAINT "UQ_4b476e6c9aa02c26b2e31cbde9f" UNIQUE ("secondPlayerProgressId");


--
-- Name: comment_reaction_counts UQ_4cc8b128a669b1d7bf185a39f0a; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment_reaction_counts
    ADD CONSTRAINT "UQ_4cc8b128a669b1d7bf185a39f0a" UNIQUE (comment_id);


--
-- Name: post_reaction_counts UQ_bcec9eecca722a68a431ec19995; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post_reaction_counts
    ADD CONSTRAINT "UQ_bcec9eecca722a68a431ec19995" UNIQUE (post_id);


--
-- Name: post UQ_d0418ddc42c5707dbc37b05bef9; Type: CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT "UQ_d0418ddc42c5707dbc37b05bef9" UNIQUE ("blogId");


--
-- Name: title; Type: INDEX; Schema: public; Owner: NodeJS
--

CREATE UNIQUE INDEX title ON public.blog USING btree (title);


--
-- Name: user_session FK_13275383dcdf095ee29f2b3455a; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT "FK_13275383dcdf095ee29f2b3455a" FOREIGN KEY (user_id) REFERENCES public.user_account(id);


--
-- Name: quiz_game FK_2185540f9c25e501a66f8c8da05; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_game
    ADD CONSTRAINT "FK_2185540f9c25e501a66f8c8da05" FOREIGN KEY ("firstPlayerProgressId") REFERENCES public.quiz_player_progress(id);


--
-- Name: current_game_question FK_25fbca64953b179fadd000971ef; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.current_game_question
    ADD CONSTRAINT "FK_25fbca64953b179fadd000971ef" FOREIGN KEY ("questionId") REFERENCES public.quiz_question(id);


--
-- Name: quiz_correct_answer FK_265c24427cf296a9fabfd22ba12; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_correct_answer
    ADD CONSTRAINT "FK_265c24427cf296a9fabfd22ba12" FOREIGN KEY ("questionId") REFERENCES public.quiz_question(id) ON DELETE CASCADE;


--
-- Name: post_reaction FK_30ae9db858e049c9fcb6f9c2b38; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post_reaction
    ADD CONSTRAINT "FK_30ae9db858e049c9fcb6f9c2b38" FOREIGN KEY (user_id) REFERENCES public.user_account(id);


--
-- Name: quiz_game FK_4b476e6c9aa02c26b2e31cbde9f; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_game
    ADD CONSTRAINT "FK_4b476e6c9aa02c26b2e31cbde9f" FOREIGN KEY ("secondPlayerProgressId") REFERENCES public.quiz_player_progress(id);


--
-- Name: comment_reaction_counts FK_4cc8b128a669b1d7bf185a39f0a; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment_reaction_counts
    ADD CONSTRAINT "FK_4cc8b128a669b1d7bf185a39f0a" FOREIGN KEY (comment_id) REFERENCES public.comment(id) ON DELETE CASCADE;


--
-- Name: post FK_5c1cf55c308037b5aca1038a131; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post
    ADD CONSTRAINT "FK_5c1cf55c308037b5aca1038a131" FOREIGN KEY ("userId") REFERENCES public.user_account(id);


--
-- Name: post_reaction FK_860c24b55da4541f8322a2bdced; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post_reaction
    ADD CONSTRAINT "FK_860c24b55da4541f8322a2bdced" FOREIGN KEY (post_id) REFERENCES public.post(id) ON DELETE CASCADE;


--
-- Name: comment FK_8aa21186314ce53c5b61a0e8c93; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93" FOREIGN KEY (post_id) REFERENCES public.post(id);


--
-- Name: comment_reaction FK_962582f04d3f639e33f43c54bbc; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT "FK_962582f04d3f639e33f43c54bbc" FOREIGN KEY (comment_id) REFERENCES public.comment(id) ON DELETE CASCADE;


--
-- Name: quiz_player_progress FK_a28876389d18070cd352623c7be; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_player_progress
    ADD CONSTRAINT "FK_a28876389d18070cd352623c7be" FOREIGN KEY ("playerId") REFERENCES public.user_account(id) ON DELETE CASCADE;


--
-- Name: comment FK_bbfe153fa60aa06483ed35ff4a7; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7" FOREIGN KEY (user_id) REFERENCES public.user_account(id);


--
-- Name: post_reaction_counts FK_bcec9eecca722a68a431ec19995; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.post_reaction_counts
    ADD CONSTRAINT "FK_bcec9eecca722a68a431ec19995" FOREIGN KEY (post_id) REFERENCES public.post(id) ON DELETE CASCADE;


--
-- Name: current_game_question FK_c7f4068d2f98032cfbf7f6d0dd5; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.current_game_question
    ADD CONSTRAINT "FK_c7f4068d2f98032cfbf7f6d0dd5" FOREIGN KEY ("quizPairId") REFERENCES public.quiz_game(id) ON DELETE CASCADE;


--
-- Name: quiz_answer FK_e3b9c2ff974aa98e83d4d37b911; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.quiz_answer
    ADD CONSTRAINT "FK_e3b9c2ff974aa98e83d4d37b911" FOREIGN KEY ("playerProgressId") REFERENCES public.quiz_player_progress(id) ON DELETE CASCADE;


--
-- Name: player_progress FK_f45661d3ff9342cf36a17c3d59c; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.player_progress
    ADD CONSTRAINT "FK_f45661d3ff9342cf36a17c3d59c" FOREIGN KEY ("playerId") REFERENCES public.user_account(id) ON DELETE CASCADE;


--
-- Name: comment_reaction FK_f8e54702e8418719a786c60fcd2; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.comment_reaction
    ADD CONSTRAINT "FK_f8e54702e8418719a786c60fcd2" FOREIGN KEY (user_id) REFERENCES public.user_account(id);


--
-- Name: blog FK_fc46ede0f7ab797b7ffacb5c08d; Type: FK CONSTRAINT; Schema: public; Owner: NodeJS
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "FK_fc46ede0f7ab797b7ffacb5c08d" FOREIGN KEY ("userId") REFERENCES public.user_account(id);


--
-- PostgreSQL database dump complete
--

