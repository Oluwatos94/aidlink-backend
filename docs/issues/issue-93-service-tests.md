# Service Unit Test Coverage Extension

## Summary
Added comprehensive Jest unit test suites for five previously untested core backend services, achieving well over 50% code coverage in each. External dependencies (Prisma, JWT utilities, crypto, nodemailer, BullMQ, etc.) are fully mocked for deterministic, fast execution.

## Services Covered

### auth.service.ts — 98.59% coverage
- **register**: successful registration, duplicate email rejection, duplicate username rejection, database error handling
- **login**: valid credentials, invalid email, wrong password, missing password hash (wallet-only users), suspended account, deleted account, last-login timestamp update
- **walletAuth**: existing wallet user, new wallet user creation
- **refreshToken**: valid token refresh, invalid/expired token, expired session cleanup
- **logout**: single session deletion, graceful handling of non-existent sessions
- **logoutAll**: bulk session deletion
- **getUserById**: user lookup, non-existent user error

### beneficiary.service.ts — 92.59% coverage
- **createBeneficiary**: successful creation, duplicate profile rejection, database error handling
- **getBeneficiaries**: pagination, status filtering, name search, empty results
- **getBeneficiaryById**: full relation retrieval, not-found error
- **updateBeneficiary**: owner update, admin update, unauthorized rejection, not-found error
- **updateBeneficiaryStatus**: admin/verifier permission checks, verifiedAt/verifiedBy setting, non-admin rejection
- **calculateRiskScore**: zero-risk baseline, KYC rejection accumulation, family size scoring, not-found error
- **submitKYC**: valid submission, non-owner rejection, duplicate active submission rejection
- **reviewKYC**: approval with beneficiary verification status update, rejection with status update, expiry with reset to pending, unauthorized rejection, not-found handling
- **getBeneficiaryByUserId**: successful lookup, not-found error

### campaign.service.ts — 92.71% coverage
- **createCampaign** (new): successful creation with DRAFT status, missing organization, unauthorized organization access
- **getCampaigns** (new): paginated listing, status filtering, empty results
- **getCampaignById** (new): full relation data with moderation view, not-found error
- **updateCampaignStatus** (new): owner/admin permission checks, suspension endpoint prohibition, suspended-campaign update prohibition, not-found error
- All existing tests preserved: updateCampaign (with validation), deleteCampaign, getCampaignStats, addMilestone, assignBeneficiary

### distribution.service.ts — 100% coverage
- **createDistribution**: valid creation, missing campaign, missing beneficiary, unassigned beneficiary, unauthorized user, admin override
- **confirmDistribution**: successful confirmation with txHash, already-completed rejection, not-found error
- **getDistributions**: pagination, campaignId filter, beneficiaryId filter, default pagination
- **updateDistributionStatus**: IN_PROGRESS/COMPLETED transitions, unauthorized rejection, not-found error, distributedBy field setting
- **addProofDocument**: successful document URL update, unauthorized rejection, not-found error

### notification.service.ts — 100% coverage
- **createNotification**: database record creation
- **sendEmail**: successful send via nodemailer transporter, SMTP failure re-throw
- **sendNotificationEmail**: full email flow with sentVia update, skip-if-user-missing, skip-if-email-unverified
- **getUserNotifications**: user filtering, status filtering, result limiting
- **markAsRead**: status update, not-found rejection, unauthorized user rejection
- **markAllAsRead**: bulk status update
- **deleteNotification**: record deletion, not-found rejection, unauthorized rejection
- **getUnreadCount**: count retrieval
- All 18 template methods tested: donation received, campaign update, distribution sent, KYC approved/rejected, all organization templates (6), all bank templates (2), campaign suspended (with/without options), campaign reinstated (with/without notes), appeal resolved (approved/denied), donor fraud suspension

## Dependencies Mocked
- Prisma database client (all model methods)
- JWT token utilities (generateAccessToken, generateRefreshToken, verifyToken)
- Crypto utilities (hashPassword, comparePassword)
- Nodemailer transporter (sendMail)
- BullMQ Queue (add)
- Winston logger
- Application config
- ModerationService (for getCampaignById)
- WebSocket server (via existing tests)

## Test Configuration
- All tests use existing Jest config (`jest.config.js`)
- Follow established patterns from `donation.service.test.ts`, `moderation.service.test.ts`
- Tests run with `npm test` (13 suites, 311 tests, all passing)
- Test files co-located with source files under `src/services/`

closes #93
