/**
 * Registra handlers mock para todos los endpoints definidos en config.ts.
 * Se importa una sola vez desde api/index.ts.
 */
import { registerMock } from "./client";
import { store, uid, User, CourseRecord, MaterialRecord, GradeRecord } from "./store";

// ============ AUTH ============
registerMock("POST", "/auth/login", (_p, body) => {
  const { email, role } = (body ?? {}) as { email: string; role: "admin" | "teacher" | "student" };
  const s = store.getState();
  const user = s.users.find((u) => u.email === email && u.role === role)
    ?? s.users.find((u) => u.role === role); // fallback demo
  if (!user) throw { status: 401, message: "Credenciales inválidas" };
  store.update((st) => { st.session = { userId: user.id, role: user.role }; });
  return { user };
});

registerMock("GET", "/auth/me", () => {
  const s = store.getState();
  if (!s.session) throw { status: 401, message: "Sin sesión" };
  return s.users.find((u) => u.id === s.session!.userId);
});

registerMock("POST", "/auth/logout", () => {
  store.update((st) => { st.session = undefined; });
  return { ok: true };
});

// ============ USERS ============
registerMock("GET", "/users", (_p, _b, q) => {
  const role = q.get("role");
  const users = store.getState().users;
  return role ? users.filter((u) => u.role === role) : users;
});

registerMock("POST", "/users", (_p, body) => {
  const { name, email, role, avatar } = body as Omit<User, "id">;
  if (!name || !email || !role) throw { status: 400, message: "Datos incompletos" };
  const exists = store.getState().users.some((u) => u.email === email);
  if (exists) throw { status: 409, message: "Email ya registrado" };
  const user: User = { id: uid("u"), name, email, role, avatar };
  store.update((s) => { s.users.push(user); });
  return user;
});

registerMock("DELETE", "/users/[^/]+", (path) => {
  const id = path.split("/").pop()!;
  store.update((s) => { s.users = s.users.filter((u) => u.id !== id); });
  return { ok: true };
});

// ============ COURSES ============
registerMock("GET", "/courses", () => store.getState().courses);

registerMock("GET", "/courses/[^/]+", (path) => {
  const id = path.split("/").pop()!;
  const c = store.getState().courses.find((c) => c.id === id);
  if (!c) throw { status: 404, message: "Curso no encontrado" };
  return c;
});

registerMock("POST", "/courses", (_p, body) => {
  const c = body as Partial<CourseRecord>;
  const course: CourseRecord = {
    id: uid("c"),
    name: c.name ?? "Curso sin título",
    emoji: c.emoji ?? "📘",
    color: (c.color as CourseRecord["color"]) ?? "primary",
    teacherId: c.teacherId!,
    description: c.description,
    weeks: c.weeks ?? 4,
    studentIds: c.studentIds ?? [],
  };
  store.update((s) => { s.courses.push(course); });
  return course;
});

registerMock("GET", "/teachers/[^/]+/courses", (path) => {
  const teacherId = path.split("/")[2];
  return store.getState().courses.filter((c) => c.teacherId === teacherId);
});

registerMock("POST", "/courses/[^/]+/students", (path, body) => {
  const courseId = path.split("/")[2];
  const { studentId } = body as { studentId: string };
  store.update((s) => {
    const c = s.courses.find((c) => c.id === courseId);
    if (c && !c.studentIds.includes(studentId)) c.studentIds.push(studentId);
  });
  return { ok: true };
});

registerMock("DELETE", "/courses/[^/]+/students/[^/]+", (path) => {
  const [, , courseId, , studentId] = path.split("/");
  store.update((s) => {
    const c = s.courses.find((c) => c.id === courseId);
    if (c) c.studentIds = c.studentIds.filter((id) => id !== studentId);
  });
  return { ok: true };
});

// ============ MATERIALES ============
registerMock("GET", "/courses/[^/]+/weeks/[^/]+/materials", (path) => {
  const [, , courseId, , week] = path.split("/");
  return store.getState().materials.filter(
    (m) => m.courseId === courseId && m.week === Number(week)
  );
});

registerMock("POST", "/courses/[^/]+/weeks/[^/]+/materials", (path, body) => {
  const [, , courseId, , week] = path.split("/");
  const m = body as Omit<MaterialRecord, "id" | "courseId" | "week" | "uploadedAt">;
  const mat: MaterialRecord = {
    id: uid("m"),
    courseId,
    week: Number(week),
    uploadedAt: new Date().toISOString(),
    ...m,
  };
  store.update((s) => { s.materials.push(mat); });
  return mat;
});

registerMock("DELETE", "/courses/[^/]+/weeks/[^/]+/materials/[^/]+", (path) => {
  const id = path.split("/").pop()!;
  store.update((s) => { s.materials = s.materials.filter((m) => m.id !== id); });
  return { ok: true };
});

// ============ NOTAS ============
registerMock("GET", "/courses/[^/]+/grades", (path) => {
  const courseId = path.split("/")[2];
  return store.getState().grades.filter((g) => g.courseId === courseId);
});

registerMock("GET", "/students/[^/]+/grades", (path) => {
  const studentId = path.split("/")[2];
  return store.getState().grades.filter((g) => g.studentId === studentId);
});

registerMock("POST", "/attempts", () => ({ attemptId: uid("a") }));
registerMock("POST", "/attempts/[^/]+/answers", () => ({ ok: true }));
registerMock("POST", "/attempts/[^/]+/finish", (_p, body) => {
  const g = body as Omit<GradeRecord, "id" | "date">;
  const grade: GradeRecord = { id: uid("g"), date: new Date().toISOString().slice(0, 10), ...g };
  store.update((s) => { s.grades.push(grade); });
  return grade;
});