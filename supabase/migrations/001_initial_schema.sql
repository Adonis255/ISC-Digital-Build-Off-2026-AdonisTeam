-- Initial Schema
create extension if not exists "uuid-ossp";
create table public.departments (id uuid primary key default gen_random_uuid(), name text not null unique, created_at timestamptz default now());