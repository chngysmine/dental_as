"use client";

import { AppointmentConfirmationModal } from "@/components/appointments/AppointmentConfirmationModal";
import BookingConfirmationStep from "@/components/appointments/BookingConfirmationStep";
import DoctorSelectionStep from "@/components/appointments/DoctorSelectionStep";
import ProgressSteps from "@/components/appointments/ProgressSteps";
import TimeSelectionStep from "@/components/appointments/TimeSelectionStep";
import Navbar from "@/components/Navbar";
import {
  useBookAppointment,
  useUserAppointments,
} from "@/hooks/use-appointment";
import { APPOINTMENT_TYPES } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

function AppointmentsPage() {
  // state management for the booking process - this could be done with something like Zustand for larger apps
  const [selectedDentistId, setSelectedDentistId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: select dentist, 2: select time, 3: confirm
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);

  const bookAppointmentMutation = useBookAppointment();
  const { data: userAppointments = [] } = useUserAppointments();

  const handleSelectDentist = (dentistId: string) => {
    setSelectedDentistId(dentistId);

    // reset the state when dentist changes
    setSelectedDate("");
    setSelectedTime("");
    setSelectedType("");
  };

  const handleBookAppointment = async () => {
    if (!selectedDentistId || !selectedDate || !selectedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const appointmentType = APPOINTMENT_TYPES.find(
      (t: { id: string }) => t.id === selectedType,
    );

    bookAppointmentMutation.mutate(
      {
        doctorId: selectedDentistId,
        date: selectedDate,
        time: selectedTime,
        reason: appointmentType?.name,
      },
      {
        onSuccess: async (appointment: any) => {
          // store the appointment details to show in the modal
          setBookedAppointment(appointment);

          try {
            const emailResponse = await fetch("/api/send-appointment-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userEmail: appointment.patientEmail,
                doctorName: appointment.doctorName,
                appointmentDate: format(
                  new Date(appointment.date),
                  "EEEE, MMMM d, yyyy",
                ),
                appointmentTime: appointment.time,
                appointmentType: appointmentType?.name,
                duration: appointmentType?.duration,
                price: appointmentType?.price,
              }),
            });

            // Read response body once (can only be read once)
            let responseText = "";
            let responseData: any = null;

            try {
              responseText = await emailResponse.text();
              console.log(
                "Email API response status:",
                emailResponse.status,
                emailResponse.statusText,
              );
              console.log(
                "Email API response text length:",
                responseText?.length || 0,
              );

              if (responseText && responseText.trim()) {
                try {
                  responseData = JSON.parse(responseText);
                  console.log("Email API response data:", responseData);
                  // Log full error details if it's an error response
                  if (!emailResponse.ok && responseData) {
                    console.error("❌ Email API Error Details:", {
                      error: responseData.error,
                      message: responseData.message,
                      details: responseData.details,
                      instructions: responseData.instructions,
                    });
                    
                    // Show user-friendly error message if it's a validation error
                    if (responseData.instructions) {
                      console.warn("📧 Email Sending Restriction:", responseData.instructions.issue);
                      console.warn("💡 Solution:", responseData.instructions.solution);
                      if (responseData.instructions.steps) {
                        console.warn("📝 Steps to fix:");
                        responseData.instructions.steps.forEach((step: string, index: number) => {
                          console.warn(`   ${index + 1}. ${step}`);
                        });
                      }
                    }
                  }
                } catch (parseError) {
                  console.log(
                    "Email API response is not JSON, keeping as text",
                  );
                  console.error(
                    "❌ Email API Error Response (Full Text):",
                    responseText,
                  );
                }
              } else {
                console.log("Email API response body is empty");
              }
            } catch (readError) {
              console.error("Failed to read email response:", readError);
            }

            if (!emailResponse.ok) {
              // Build comprehensive error info with guaranteed fields
              const status = emailResponse.status;
              const statusText = emailResponse.statusText || "Unknown status";
              let message = "Failed to send confirmation email";
              const details: any = {};

              // Extract message from response if available
              if (responseData) {
                if (responseData.error) {
                  message = responseData.error;
                } else if (responseData.message) {
                  message = responseData.message;
                }
                Object.assign(details, responseData);
              }

              // Add raw response if it's not JSON
              if (responseText && responseText.trim() && !responseData) {
                details.rawResponse = responseText.substring(0, 500);
                message = `Failed to send email: ${responseText.substring(0, 100)}`;
              }

              // Log the error with explicit properties to avoid serialization issues
              // Note: This is not a critical error - appointment was booked successfully
              console.warn(
                "⚠️ Email notification failed (appointment was still booked successfully)",
              );
              console.warn("Status:", status);
              console.warn("Message:", message);

              // Only log detailed error info if it's not the common "API key missing" error
              if (
                message &&
                !message.includes("RESEND_API_KEY") &&
                !message.includes("not configured")
              ) {
                if (responseText && responseText.trim()) {
                  console.warn(
                    "Response Text:",
                    responseText.substring(0, 300),
                  );
                }
                if (responseData && Object.keys(responseData).length > 0) {
                  console.warn("Response Data:", responseData);
                }
              } else {
                console.info(
                  "💡 To enable email notifications, add RESEND_API_KEY to your .env.local file",
                );
              }

              // Don't show error to user - appointment was booked successfully
              // Email is optional, so we silently fail
            } else {
              // Success case - log for debugging
              console.log(
                "✅ Email sent successfully:",
                responseData || "Response OK",
              );
            }
          } catch (error) {
            // Log detailed error information
            const errorDetails =
              error instanceof Error
                ? {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                  }
                : { error: String(error) };

            console.error("Error sending confirmation email:", errorDetails);
            // Don't show error to user - appointment was booked successfully
            // Email is optional, so we silently fail
          }

          // show the success modal
          setShowConfirmationModal(true);

          // reset form
          setSelectedDentistId(null);
          setSelectedDate("");
          setSelectedTime("");
          setSelectedType("");
          setCurrentStep(1);
        },
        onError: (error: any) =>
          toast.error(`Failed to book appointment: ${error.message}`),
      },
    );
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">
            Find and book with verified dentists in your area
          </p>
        </div>

        <ProgressSteps currentStep={currentStep} />

        {currentStep === 1 && (
          <DoctorSelectionStep
            selectedDentistId={selectedDentistId}
            onContinue={() => setCurrentStep(2)}
            onSelectDentist={handleSelectDentist}
          />
        )}

        {currentStep === 2 && selectedDentistId && (
          <TimeSelectionStep
            selectedDentistId={selectedDentistId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedType={selectedType}
            onBack={() => setCurrentStep(1)}
            onContinue={() => setCurrentStep(3)}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onTypeChange={setSelectedType}
          />
        )}

        {currentStep === 3 && selectedDentistId && (
          <BookingConfirmationStep
            selectedDentistId={selectedDentistId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedType={selectedType}
            isBooking={bookAppointmentMutation.isPending}
            onBack={() => setCurrentStep(2)}
            onModify={() => setCurrentStep(2)}
            onConfirm={handleBookAppointment}
          />
        )}
      </div>

      {bookedAppointment && (
        <AppointmentConfirmationModal
          open={showConfirmationModal}
          onOpenChange={setShowConfirmationModal}
          appointmentDetails={{
            doctorName: bookedAppointment.doctorName,
            appointmentDate: format(
              new Date(bookedAppointment.date),
              "EEEE, MMMM d, yyyy",
            ),
            appointmentTime: bookedAppointment.time,
            userEmail: bookedAppointment.patientEmail,
          }}
        />
      )}

      {/* SHOW EXISTING APPOINTMENTS FOR THE CURRENT USER */}
      {userAppointments.length > 0 && (
        <div className="mb-8 max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-xl font-semibold mb-4">Your Appointments</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userAppointments
              .filter(
                (appointment: any) =>
                  appointment.doctor || appointment.doctorName,
              )
              .map((appointment: any) => {
                const doctorName =
                  appointment.doctor?.name ||
                  appointment.doctorName ||
                  "Unknown Doctor";
                const doctorImageUrl =
                  appointment.doctor?.imageUrl ||
                  appointment.doctorImageUrl ||
                  "";

                // Debug log (remove in production)
                if (!appointment.doctor && !appointment.doctorName) {
                  console.warn(
                    "Appointment missing doctor data:",
                    appointment.id,
                  );
                }

                return (
                  <div
                    key={appointment.id}
                    className="bg-card border rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {doctorImageUrl && doctorImageUrl.trim() ? (
                          <img
                            src={doctorImageUrl}
                            alt={doctorName}
                            className="size-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector("span")) {
                                const initial = doctorName
                                  .charAt(0)
                                  .toUpperCase();
                                parent.innerHTML = `<span class="text-primary font-semibold text-sm">${initial}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-primary font-semibold text-sm">
                            {doctorName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doctorName}</p>
                        <p className="text-muted-foreground text-xs">
                          {appointment.reason || "General Consultation"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm mb-3">
                      <p className="text-muted-foreground">
                        📅 {format(new Date(appointment.date), "MMM d, yyyy")}
                      </p>
                      <p className="text-muted-foreground">
                        🕐 {appointment.time}
                      </p>
                    </div>
                    {appointment.status && (
                      <div className="mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-800"
                                : appointment.status === "PENDING"
                                  ? "bg-orange-100 text-orange-800"
                                  : appointment.status === "CANCELLED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}

export default AppointmentsPage;
