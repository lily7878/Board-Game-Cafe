package ro.boardgamecafe.core.domain.table;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import ro.boardgamecafe.core.domain.day.BusinessDay;
import ro.boardgamecafe.core.domain.staff.StaffRole;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.exception.ConflictException;

class TableSessionTest {
    private TableSession session;

    @BeforeEach
    void setUp() {
        BusinessDay day = Mockito.mock(BusinessDay.class);
        Mockito.when(day.isOpen()).thenReturn(true);
        session = new TableSession(new CafeTable(1, 4), new StaffUser("S", "s@test.ro", "h", StaffRole.STAFF), day,
                new BigDecimal("10.00"), "digest", "pinHash", "tokenEnc", "pinEnc");
    }

    @Test
    void checkoutLocksFees_andReopenKeepsThemLocked() {
        session.startCheckout();
        assertThat(session.getStatus()).isEqualTo(SessionStatus.CHECKOUT_PENDING);
        assertThat(session.isFeesLocked()).isTrue();

        session.reopen();
        assertThat(session.getStatus()).isEqualTo(SessionStatus.ACTIVE);
        assertThat(session.isFeesLocked()).isTrue();
    }

    @Test
    void paymentClosesSession_andDropsRecoverableCredentials() {
        session.startCheckout();
        session.closeAfterPayment();

        assertThat(session.getStatus()).isEqualTo(SessionStatus.CLOSED);
        assertThat(session.getClosedAt()).isNotNull();
        assertThat(session.getJoinTokenEncrypted()).isNull();
        assertThat(session.getPinEncrypted()).isNull();
    }

    @Test
    void invalidTransitionsAreRejected() {
        assertThatThrownBy(session::reopen).isInstanceOf(ConflictException.class);
        assertThatThrownBy(session::closeAfterPayment).isInstanceOf(ConflictException.class);
        session.startCheckout();
        assertThatThrownBy(session::startCheckout).isInstanceOf(ConflictException.class);
        session.closeAfterPayment();
        assertThatThrownBy(session::reopen).isInstanceOf(ConflictException.class);
    }

    @Test
    void sessionRequiresOpenBusinessDay() {
        BusinessDay finalized = Mockito.mock(BusinessDay.class);
        Mockito.when(finalized.isOpen()).thenReturn(false);
        assertThatThrownBy(() -> new TableSession(new CafeTable(2, 2),
                new StaffUser("S", "s2@test.ro", "h", StaffRole.STAFF), finalized, BigDecimal.TEN,
                "d", "p", "t", "e")).isInstanceOf(IllegalArgumentException.class);
    }
}
