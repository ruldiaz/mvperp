"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Tooltip,
  InputAdornment
} from "@mui/material";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Settings2,
  Lock,
  Save,
  X,
  Edit2,
  FileBadge,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Info
} from "lucide-react";
import {
  Company,
  CompanyFormData,
  REGIMENES_FISCALES,
  PAC_OPTIONS,
} from "@/types/company";

export default function CompanyProfile() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    rfc: "",
    regime: "",
    street: "",
    exteriorNumber: "",
    neighborhood: "",
    postalCode: "",
    city: "",
    state: "",
    municipality: "",
    country: "México",
    email: "",
    phone: "",
    pac: "",
    pacUser: "",
    pacPass: "",
    testMode: true,
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const response = await fetch("/api/company", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          setCompany(data.company);
          setFormData({
            ...data.company,
            interiorNumber: data.company.interiorNumber || "",
            country: data.company.country || "México",
            email: data.company.email || "",
            phone: data.company.phone || "",
            pac: data.company.pac || "",
            pacUser: data.company.pacUser || "",
            pacPass: data.company.pacPass || "",
            csdCert: data.company.csdCert || undefined,
            csdKey: data.company.csdKey || undefined,
            csdPassword: data.company.csdPassword || undefined,
          });
        }
      } else if (response.status === 404) {
        setCompany(null);
      }
    } catch (error) {
      console.error("Error al cargar datos de la compañía:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const { csdCert, csdKey, csdPassword, ...companyData } = formData;

      const companyRes = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
        credentials: "include",
      });

      if (!companyRes.ok) {
        const errData = await companyRes.json();
        throw new Error(errData.error || "Error al guardar datos fiscales");
      }

      const companyResult = await companyRes.json();
      setCompany(companyResult.company);

      if (csdCert && csdKey && csdPassword) {
        const csdRes = await fetch("/api/company/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csdCert, csdKey, csdPassword }),
          credentials: "include",
        });

        if (!csdRes.ok) {
          const csdData = await csdRes.json();
          throw new Error(csdData.error || "El certificado no es válido");
        }
      }

      setMessage("Datos guardados correctamente");
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      setMessage(error instanceof Error ? error.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string, value: any, type?: string } }
  ) => {
    const { name, value, type } = e.target;
    
    if (name === "testMode" && type === "checkbox") {
      const newTestMode = (e.target as any).checked;
      
      if (!newTestMode && formData.testMode) {
        const confirmed = window.confirm(
          '⚠️ ADVERTENCIA: Activación de Modo PRODUCCIÓN\n\n' +
          '• Las facturas se timbrarán con el SAT de forma REAL\n' +
          '• Se consumirán timbres reales (costo por factura)\n' +
          '• Las facturas serán legalmente válidas\n' +
          '• La cancelación requiere aprobación del receptor\n' +
          '• Asegúrese de tener certificados CSD válidos\n\n' +
          '¿Está seguro de que desea activar el modo PRODUCCIÓN?'
        );
        
        if (!confirmed) {
          return;
        }
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as any).checked : value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        ...company,
        interiorNumber: company.interiorNumber || "",
        country: company.country || "México",
        email: company.email || "",
        phone: company.phone || "",
        pac: company.pac || "",
        pacUser: company.pacUser || "",
        pacPass: company.pacPass || "",
        csdCert: company.csdCert || undefined,
        csdKey: company.csdKey || undefined,
        csdPassword: company.csdPassword || undefined,
      });
    }
    setIsEditing(false);
    setMessage("");
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={32} sx={{ color: '#334155' }} />
      </Box>
    );
  }

  const PAC_OPTIONS_MUI = PAC_OPTIONS;
  const REGIMENES_FISCALES_MUI = REGIMENES_FISCALES;

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 6, px: 3, animation: "fadeIn 0.3s ease" }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <IconButton onClick={() => router.push("/dashboard")} size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
              <ArrowLeft size={18} />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
              Perfil de Empresa
            </Typography>
          </Stack>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem', ml: 4 }}>
            Configura tus datos fiscales y de facturación
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {!isEditing ? (
            <Button
              variant="contained"
              onClick={handleEdit}
              startIcon={<Edit2 size={18} />}
              sx={{ borderRadius: 1.5, px: 3, py: 1.2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
            >
              Editar Configuración
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<X size={18} />}
                sx={{ borderRadius: 1.5, px: 3, py: 1.2, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSubmit()}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                sx={{ borderRadius: 1.5, px: 3, py: 1.2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
              >
                {saving ? "Guardando..." : "Guardar Datos"}
              </Button>
            </>
          )}
        </Stack>
      </Box>


      <Stack spacing={4}>
        {/* Status Messages */}
        {saving && (
          <Alert
            severity="info"
            icon={<Lock size={18} color="#64748b" />}
            sx={{ borderRadius: 2, bgcolor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1', '& .MuiAlert-icon': { color: '#0369a1' } }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Validando certificado...</Typography>
            <Typography variant="caption">Verificando RFC, vigencia y correspondencia entre certificado y llave privada</Typography>
          </Alert>
        )}

        {message && !saving && (
          <Alert
            severity={message.includes("Error") || message.includes("fallida") ? "error" : "success"}
            icon={message.includes("Error") || message.includes("fallida") ? <AlertTriangle size={18} color="#64748b" /> : <CheckCircle2 size={18} color="#64748b" />}
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{message}</Typography>
            {message.includes("contraseña") && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                💡 Asegúrate de usar la contraseña correcta del CSD (la que utilizaste al generar los archivos)
              </Typography>
            )}
          </Alert>
        )}

        {!isEditing && company?.csdCert && (
          <Alert
            severity="success"
            icon={<ShieldCheck size={18} color="#64748b" />}
            sx={{ borderRadius: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d', '& .MuiAlert-icon': { color: '#15803d' } }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Certificado de Sello Digital cargado y validado</Typography>
          </Alert>
        )}

        {/* Main Content Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Información Básica */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Building2 size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Básica</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Razón Social *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing}
                    placeholder="Nombre legal de la empresa"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="RFC *"
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing}
                    placeholder="XAXX010101000"
                    slotProps={{ htmlInput: { maxLength: 13, style: { textTransform: 'uppercase' } } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Régimen Fiscal *</InputLabel>
                    <Select
                      name="regime"
                      value={formData.regime}
                      onChange={handleInputChange as any}
                      required
                      disabled={!isEditing}
                      label="Régimen Fiscal *"
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value=""><em>Seleccionar régimen</em></MenuItem>
                      {REGIMENES_FISCALES_MUI.map((regimen) => (
                        <MenuItem key={regimen.value} value={regimen.value}>
                          {regimen.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>


            {/* Domicilio Fiscal */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <MapPin size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Domicilio Fiscal</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    fullWidth size="small" label="Calle *" name="street" value={formData.street} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="Nombre de la calle" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField 
                    fullWidth size="small" label="Núm. Exterior *" name="exteriorNumber" value={formData.exteriorNumber} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="123" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField 
                    fullWidth size="small" label="Núm. Interior" name="interiorNumber" value={formData.interiorNumber || ""} onChange={handleInputChange} 
                    disabled={!isEditing} placeholder="A" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField 
                    fullWidth size="small" label="Colonia *" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="Nombre de la colonia" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField 
                    fullWidth size="small" label="Código Postal *" name="postalCode" value={formData.postalCode} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="00000" slotProps={{ htmlInput: { maxLength: 5 } }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField 
                    fullWidth size="small" label="Ciudad *" name="city" value={formData.city} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="Ciudad" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField 
                    fullWidth size="small" label="Estado *" name="state" value={formData.state} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="Estado" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>

                <Grid size={{ xs: 6, md: 6 }}>
                  <TextField 
                    fullWidth size="small" label="Municipio *" name="municipality" value={formData.municipality} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="Municipio" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    fullWidth size="small" label="País *" name="country" value={formData.country} onChange={handleInputChange} 
                    required disabled={!isEditing} placeholder="México" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
              </Grid>
            </Paper>


            {/* Contacto */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Phone size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Contacto</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    fullWidth size="small" label="Email" name="email" type="email" value={formData.email || ""} onChange={handleInputChange} 
                    disabled={!isEditing} placeholder="empresa@ejemplo.com" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Mail size={16} color="#64748b" /></InputAdornment> } }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    fullWidth size="small" label="Teléfono" name="phone" type="tel" value={formData.phone || ""} onChange={handleInputChange} 
                    disabled={!isEditing} placeholder="+52 123 456 7890" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Phone size={16} color="#64748b" /></InputAdornment> } }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Configuración PAC */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Settings2 size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Configuración de Timbrado (PAC)</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>PAC</InputLabel>
                    <Select
                      name="pac"
                      value={formData.pac || ""}
                      onChange={handleInputChange as any}
                      disabled={!isEditing}
                      label="PAC"
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value=""><em>Seleccionar PAC</em></MenuItem>
                      {PAC_OPTIONS_MUI.map((pac) => (
                        <MenuItem key={pac.value} value={pac.value}>{pac.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField 
                    fullWidth size="small" label="Usuario PAC" name="pacUser" value={formData.pacUser || ""} onChange={handleInputChange} 
                    disabled={!isEditing} placeholder="usuario_pac" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField 
                    fullWidth size="small" label="Contraseña PAC" name="pacPass" type="password" value={formData.pacPass || ""} onChange={handleInputChange} 
                    disabled={!isEditing} placeholder="••••••••" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} 
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          name="testMode" 
                          checked={formData.testMode} 
                          onChange={handleInputChange as any} 
                          disabled={!isEditing}
                          sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Modo Pruebas (Sandbox)</Typography>}
                    />
                    <Box sx={{ 
                      px: 2, py: 0.5, borderRadius: 5, fontSize: '0.75rem', fontWeight: 800,
                      bgcolor: formData.testMode ? '#fefce8' : '#f0fdf4',
                      color: formData.testMode ? '#854d0e' : '#16a34a',
                      border: `1px solid ${formData.testMode ? '#fef08a' : '#bbf7d0'}`,
                      display: 'flex', alignItems: 'center', gap: 1
                    }}>
                      {formData.testMode ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                      {formData.testMode ? 'SANDBOX ACTIVADO' : 'PRODUCCIÓN ACTIVA'}
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Alert 
                    severity={formData.testMode ? "info" : "warning"}
                    icon={formData.testMode ? <Info size={18} /> : <AlertTriangle size={18} />}
                    sx={{ borderRadius: 2 }}
                  >
                    {formData.testMode ? (
                      <Typography variant="caption">
                        <strong>Modo Sandbox:</strong> Las facturas se timbran en el ambiente de pruebas. No son válidas fiscalmente y no consumen timbres reales.
                      </Typography>
                    ) : (
                      <Typography variant="caption">
                        <strong>Modo Producción:</strong> Las facturas se timbran con el SAT de forma real. Son legalmente válidas y consumen timbres reales.
                      </Typography>
                    )}
                  </Alert>
                </Grid>
              </Grid>
            </Paper>


            {/* 🔐 Certificado de Sello Digital (CSD) – Solo en edición */}
            {isEditing && (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#fecaca', bgcolor: '#fffafb' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Lock size={18} color="#dc2626" strokeWidth={1.5} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#991b1b' }}>Certificado de Sello Digital (CSD)</Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569' }}>Certificado (.cer)</Typography>
                    <Button 
                      component="label" variant="outlined" fullWidth startIcon={<FileBadge size={16} />}
                      sx={{ borderRadius: 1.5, textTransform: 'none', height: 42, borderColor: '#cbd5e1', color: '#475569' }}
                    >
                      {formData.csdCert ? "Certificado seleccionado" : "Subir Archivo .cer"}
                      <input
                        type="file" hidden accept=".cer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const binary = reader.result as string;
                              const base64 = btoa(binary);
                              setFormData((prev) => ({ ...prev, csdCert: base64 }));
                            };
                            reader.readAsBinaryString(file);
                          }
                        }}
                      />
                    </Button>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569' }}>Llave privada (.key)</Typography>
                    <Button 
                      component="label" variant="outlined" fullWidth startIcon={<Lock size={16} />}
                      sx={{ borderRadius: 1.5, textTransform: 'none', height: 42, borderColor: '#cbd5e1', color: '#475569' }}
                    >
                      {formData.csdKey ? "Llave seleccionada" : "Subir Archivo .key"}
                      <input
                        type="file" hidden accept=".key"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                const base64 = btoa(reader.result);
                                setFormData((prev) => ({ ...prev, csdKey: base64 }));
                              }
                            };
                            reader.readAsBinaryString(file);
                          }
                        }}
                      />
                    </Button>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      fullWidth size="small" label="Contraseña del CSD" type="password" value={formData.csdPassword || ""} 
                      onChange={(e) => setFormData((prev) => ({ ...prev, csdPassword: e.target.value }))}
                      placeholder="Contraseña del certificado"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: '#fff' } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Bottom Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, mb: 10 }}>
              {isEditing ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{ borderRadius: 1.5, px: 4, py: 1.2, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleSubmit()}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                    sx={{ borderRadius: 1.5, px: 4, py: 1.2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
                  >
                    {saving ? "Guardando..." : "Guardar Datos"}
                  </Button>
                </>
              ) : (
                !company && (
                  <Button
                    variant="contained"
                    onClick={handleEdit}
                    startIcon={<Plus size={18} />}
                    sx={{ borderRadius: 1.5, px: 4, py: 1.2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
                  >
                    Crear Datos Fiscales
                  </Button>
                )
              )}
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

